
-- ============================================================
-- HOTELSPHERE - ORDS REST API CONFIGURATION
-- Database: Oracle 26ai Free
-- Schema: HOTELSPHERE
-- Module: hotelsphere.api
-- ============================================================

BEGIN

    -- Enable REST for HOTELSPHERE schema
    ORDS.ENABLE_SCHEMA(
        p_enabled             => TRUE,
        p_schema              => USER,
        p_url_mapping_type    => 'BASE_PATH',
        p_url_mapping_pattern => 'hotelsphere',
        p_auto_rest_auth      => FALSE
    );

    -- Create REST API module
    ORDS.DEFINE_MODULE(
        p_module_name    => 'hotelsphere.api',
        p_base_path      => '/api/',
        p_items_per_page => 50,
        p_status         => 'PUBLISHED'
    );

    -- ========================================================
    -- 1. HEALTH API
    -- GET /health
    -- ========================================================

    ORDS.DEFINE_TEMPLATE(
        p_module_name => 'hotelsphere.api',
        p_pattern     => 'health'
    );

    ORDS.DEFINE_HANDLER(
        p_module_name => 'hotelsphere.api',
        p_pattern     => 'health',
        p_method      => 'GET',
        p_source_type => ORDS.source_type_plsql,
        p_source      => q'~
        BEGIN
            OWA_UTIL.mime_header('application/json', FALSE);
            OWA_UTIL.http_header_close;
            HTP.p('{"status":"ok"}');
        END;
        ~'
    );

    -- ========================================================
    -- 2. ROOMS API
    -- GET /rooms
    -- ========================================================

    ORDS.DEFINE_TEMPLATE(
        p_module_name => 'hotelsphere.api',
        p_pattern     => 'rooms'
    );

    ORDS.DEFINE_HANDLER(
        p_module_name => 'hotelsphere.api',
        p_pattern     => 'rooms',
        p_method      => 'GET',
        p_source_type => ORDS.source_type_plsql,
        p_source      => q'~
        DECLARE
            j CLOB;
        BEGIN
            SELECT JSON_ARRAYAGG(
                JSON_OBJECT(
                    'room_id'    VALUE r.room_id,
                    'room_number' VALUE r.room_number,
                    'room_type'  VALUE t.type_name,
                    'branch'     VALUE b.branch_name,
                    'floor_no'   VALUE r.floor_no,
                    'status'     VALUE r.status,
                    'rate'       VALUE t.base_rate,
                    'capacity'   VALUE t.capacity
                    RETURNING CLOB
                )
                RETURNING CLOB
            )
            INTO j
            FROM hs_rooms r
            JOIN hs_room_types t
                ON t.room_type_id = r.room_type_id
            JOIN hs_branches b
                ON b.branch_id = r.branch_id;

            OWA_UTIL.mime_header('application/json', FALSE);
            OWA_UTIL.http_header_close;
            HTP.prn(NVL(j, '[]'));
        END;
        ~'
    );

    -- ========================================================
    -- 3. CUSTOMERS API
    -- GET /customers
    -- ========================================================

    ORDS.DEFINE_TEMPLATE(
        p_module_name => 'hotelsphere.api',
        p_pattern     => 'customers'
    );

    ORDS.DEFINE_HANDLER(
        p_module_name => 'hotelsphere.api',
        p_pattern     => 'customers',
        p_method      => 'GET',
        p_source_type => ORDS.source_type_plsql,
        p_source      => q'~
        DECLARE
            j CLOB;
        BEGIN
            SELECT JSON_ARRAYAGG(
                JSON_OBJECT(
                    'customer_id'   VALUE customer_id,
                    'full_name'     VALUE full_name,
                    'email'         VALUE email,
                    'phone'         VALUE phone,
                    'loyalty_tier'  VALUE loyalty_tier,
                    'loyalty_points' VALUE loyalty_points
                    RETURNING CLOB
                )
                RETURNING CLOB
            )
            INTO j
            FROM hs_customers;

            OWA_UTIL.mime_header('application/json', FALSE);
            OWA_UTIL.http_header_close;
            HTP.prn(NVL(j, '[]'));
        END;
        ~'
    );

    -- POST /customers

    ORDS.DEFINE_HANDLER(
        p_module_name => 'hotelsphere.api',
        p_pattern     => 'customers',
        p_method      => 'POST',
        p_source_type => ORDS.source_type_plsql,
        p_source      => q'~
        DECLARE
            n VARCHAR2(120);
            e VARCHAR2(160);
            ph VARCHAR2(25);
            i NUMBER;
            j CLOB;
        BEGIN
            SELECT full_name, email, phone
            INTO n, e, ph
            FROM JSON_TABLE(
                :body_text,
                '$'
                COLUMNS(
                    full_name VARCHAR2(120) PATH '$.full_name',
                    email     VARCHAR2(160) PATH '$.email',
                    phone     VARCHAR2(25) PATH '$.phone'
                )
            );

            hs_customer_pkg.create_customer(n, e, ph, i);
            COMMIT;

            SELECT JSON_OBJECT(
                'customer_id' VALUE i,
                'message' VALUE 'created'
                RETURNING CLOB
            )
            INTO j
            FROM dual;

            OWA_UTIL.mime_header('application/json', FALSE);
            OWA_UTIL.http_header_close;
            HTP.prn(j);

        EXCEPTION
            WHEN OTHERS THEN
                ROLLBACK;
                RAISE;
        END;
        ~'
    );

    -- ========================================================
    -- 4. BOOKINGS API
    -- GET /bookings
    -- ========================================================

    ORDS.DEFINE_TEMPLATE(
        p_module_name => 'hotelsphere.api',
        p_pattern     => 'bookings'
    );

    ORDS.DEFINE_HANDLER(
        p_module_name => 'hotelsphere.api',
        p_pattern     => 'bookings',
        p_method      => 'GET',
        p_source_type => ORDS.source_type_plsql,
        p_source      => q'~
        DECLARE
            j CLOB;
        BEGIN
            SELECT JSON_ARRAYAGG(
                JSON_OBJECT(
                    'booking_id'     VALUE booking_id,
                    'booking_code'   VALUE booking_code,
                    'customer_name'  VALUE customer_name,
                    'room_number'    VALUE room_number,
                    'check_in'       VALUE TO_CHAR(check_in, 'YYYY-MM-DD'),
                    'check_out'      VALUE TO_CHAR(check_out, 'YYYY-MM-DD'),
                    'total_amount'   VALUE total_amount,
                    'booking_status' VALUE booking_status
                    RETURNING CLOB
                )
                RETURNING CLOB
            )
            INTO j
            FROM hs_v_booking_details;

            OWA_UTIL.mime_header('application/json', FALSE);
            OWA_UTIL.http_header_close;
            HTP.prn(NVL(j, '[]'));
        END;
        ~'
    );

    -- POST /bookings
    -- Accepts an existing customer_id OR guest details from checkout.
    -- Guest details are matched by email; otherwise a customer is created.

    ORDS.DEFINE_HANDLER(
        p_module_name => 'hotelsphere.api',
        p_pattern     => 'bookings',
        p_method      => 'POST',
        p_source_type => ORDS.source_type_plsql,
        p_source      => q'~
        DECLARE
            c NUMBER;
            r NUMBER;
            d1 DATE;
            d2 DATE;
            a NUMBER;
            ch NUMBER;
            n VARCHAR2(120);
            e VARCHAR2(160);
            ph VARCHAR2(25);
            addr VARCHAR2(300);
            i NUMBER;
            code VARCHAR2(24);
            j CLOB;
        BEGIN
            SELECT
                customer_id,
                room_id,
                TO_DATE(check_in, 'YYYY-MM-DD'),
                TO_DATE(check_out, 'YYYY-MM-DD'),
                NVL(adults, NVL(guests, 1)),
                NVL(children, 0),
                full_name,
                email,
                phone,
                address
            INTO c, r, d1, d2, a, ch, n, e, ph, addr
            FROM JSON_TABLE(
                :body_text,
                '$'
                COLUMNS(
                    customer_id NUMBER PATH '$.customer_id' NULL ON ERROR,
                    room_id NUMBER PATH '$.room_id',
                    check_in VARCHAR2(10) PATH '$.check_in',
                    check_out VARCHAR2(10) PATH '$.check_out',
                    adults NUMBER PATH '$.adults' NULL ON ERROR,
                    guests NUMBER PATH '$.guests' NULL ON ERROR,
                    children NUMBER PATH '$.children' NULL ON ERROR,
                    full_name VARCHAR2(120) PATH '$.full_name' NULL ON ERROR,
                    email VARCHAR2(160) PATH '$.email' NULL ON ERROR,
                    phone VARCHAR2(25) PATH '$.phone' NULL ON ERROR,
                    address VARCHAR2(300) PATH '$.address' NULL ON ERROR
                )
            );

            IF c IS NULL THEN
                IF TRIM(e) IS NULL OR TRIM(n) IS NULL THEN
                    RAISE_APPLICATION_ERROR(-20040, 'Guest name and email are required.');
                END IF;

                BEGIN
                    SELECT customer_id INTO c
                    FROM hs_customers
                    WHERE LOWER(email) = LOWER(TRIM(e));
                    UPDATE hs_customers
                    SET full_name = TRIM(n),
                        phone = NVL(TRIM(ph), phone),
                        address = NVL(TRIM(addr), address)
                    WHERE customer_id = c;
                EXCEPTION
                    WHEN NO_DATA_FOUND THEN
                        INSERT INTO hs_customers(full_name, email, phone, address)
                        VALUES(TRIM(n), LOWER(TRIM(e)), TRIM(ph), TRIM(addr))
                        RETURNING customer_id INTO c;
                END;
            END IF;

            hs_booking_pkg.create_booking(
                c, r, d1, d2, a, ch, i, code
            );

            COMMIT;

            SELECT JSON_OBJECT(
                'booking_id' VALUE i,
                'booking_code' VALUE code,
                'customer_id' VALUE c,
                'message' VALUE 'Booking created'
                RETURNING CLOB
            )
            INTO j
            FROM dual;

            OWA_UTIL.mime_header('application/json', FALSE);
            OWA_UTIL.http_header_close;
            HTP.prn(j);

        EXCEPTION
            WHEN OTHERS THEN
                ROLLBACK;
                RAISE;
        END;
        ~'
    );

    -- ========================================================
    -- 5. CANCEL BOOKING API
    -- POST /bookings/{booking_id}/cancel
    -- ========================================================

    ORDS.DEFINE_TEMPLATE(
        p_module_name => 'hotelsphere.api',
        p_pattern     => 'bookings/{booking_id}/cancel'
    );

    ORDS.DEFINE_HANDLER(
        p_module_name => 'hotelsphere.api',
        p_pattern     => 'bookings/{booking_id}/cancel',
        p_method      => 'POST',
        p_source_type => ORDS.source_type_plsql,
        p_source      => q'~
        BEGIN
            hs_booking_pkg.cancel_booking(
                TO_NUMBER(:booking_id)
            );

            COMMIT;

            OWA_UTIL.mime_header('application/json', FALSE);
            OWA_UTIL.http_header_close;
            HTP.p('{"message":"cancelled"}');

        EXCEPTION
            WHEN OTHERS THEN
                ROLLBACK;
                RAISE;
        END;
        ~'
    );

    -- ========================================================
    -- 6. PAYMENTS API
    -- GET /payments
    -- ========================================================

    ORDS.DEFINE_TEMPLATE(
        p_module_name => 'hotelsphere.api',
        p_pattern     => 'payments'
    );

    ORDS.DEFINE_HANDLER(
        p_module_name => 'hotelsphere.api',
        p_pattern     => 'payments',
        p_method      => 'GET',
        p_source_type => ORDS.source_type_plsql,
        p_source      => q'~
        DECLARE
            j CLOB;
        BEGIN
            SELECT JSON_ARRAYAGG(
                JSON_OBJECT(
                    'payment_id'   VALUE p.payment_id,
                    'booking_id'   VALUE p.booking_id,
                    'booking_code' VALUE b.booking_code,
                    'amount'       VALUE p.amount,
                    'method'       VALUE p.payment_method,
                    'status'       VALUE p.payment_status,
                    'paid_at'      VALUE TO_CHAR(
                        p.paid_at,
                        'YYYY-MM-DD HH24:MI'
                    )
                    RETURNING CLOB
                )
                RETURNING CLOB
            )
            INTO j
            FROM hs_payments p
            JOIN hs_bookings b
                ON b.booking_id = p.booking_id;

            OWA_UTIL.mime_header('application/json', FALSE);
            OWA_UTIL.http_header_close;
            HTP.prn(NVL(j, '[]'));
        END;
        ~'
    );

    -- POST /payments

    ORDS.DEFINE_HANDLER(
        p_module_name => 'hotelsphere.api',
        p_pattern     => 'payments',
        p_method      => 'POST',
        p_source_type => ORDS.source_type_plsql,
        p_source      => q'~
        DECLARE
            b NUMBER;
            a NUMBER;
            m VARCHAR2(20);
            ref VARCHAR2(80);
            i NUMBER;
            j CLOB;
        BEGIN
            SELECT booking_id, amount, method, reference_no
            INTO b, a, m, ref
            FROM JSON_TABLE(
                :body_text,
                '$'
                COLUMNS(
                    booking_id  NUMBER PATH '$.booking_id',
                    amount      NUMBER PATH '$.amount',
                    method      VARCHAR2(20) PATH '$.method',
                    reference_no VARCHAR2(80) PATH '$.reference_no'
                        NULL ON ERROR
                )
            );

            hs_billing_pkg.record_payment(b, a, m, ref, i);
            COMMIT;

            SELECT JSON_OBJECT(
                'payment_id' VALUE i
                RETURNING CLOB
            )
            INTO j
            FROM dual;

            OWA_UTIL.mime_header('application/json', FALSE);
            OWA_UTIL.http_header_close;
            HTP.prn(j);

        EXCEPTION
            WHEN OTHERS THEN
                ROLLBACK;
                RAISE;
        END;
        ~'
    );

    -- ========================================================
    -- 7. DASHBOARD API
    -- GET /dashboard
    -- ========================================================

    ORDS.DEFINE_TEMPLATE(
        p_module_name => 'hotelsphere.api',
        p_pattern     => 'dashboard'
    );

    ORDS.DEFINE_HANDLER(
        p_module_name => 'hotelsphere.api',
        p_pattern     => 'dashboard',
        p_method      => 'GET',
        p_source_type => ORDS.source_type_plsql,
        p_source      => q'~
        DECLARE
            r NUMBER;
            o NUMBER;
            b NUMBER;
            c NUMBER;
            rev NUMBER;
            j CLOB;
        BEGIN
            SELECT COUNT(*)
            INTO r
            FROM hs_rooms
            WHERE status <> 'INACTIVE';

            SELECT COUNT(DISTINCT room_id)
            INTO o
            FROM hs_bookings
            WHERE booking_status = 'CHECKED_IN';

            SELECT COUNT(*)
            INTO b
            FROM hs_bookings
            WHERE booking_status = 'CONFIRMED';

            SELECT COUNT(*)
            INTO c
            FROM hs_customers;

            SELECT NVL(SUM(amount), 0)
            INTO rev
            FROM hs_payments
            WHERE payment_status = 'SUCCESS';

            SELECT JSON_OBJECT(
                'total_rooms' VALUE r,
                'occupied_rooms' VALUE o,
                'confirmed_bookings' VALUE b,
                'total_customers' VALUE c,
                'total_revenue' VALUE rev
                RETURNING CLOB
            )
            INTO j
            FROM dual;

            OWA_UTIL.mime_header('application/json', FALSE);
            OWA_UTIL.http_header_close;
            HTP.prn(j);
        END;
        ~'
    );

    COMMIT;

END;
/
