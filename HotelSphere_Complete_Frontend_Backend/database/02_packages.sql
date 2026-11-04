CREATE OR REPLACE PACKAGE hs_booking_pkg AS
PROCEDURE create_booking(p_customer_id NUMBER,p_room_id NUMBER,p_check_in DATE,p_check_out DATE,p_adults NUMBER,p_children NUMBER,p_booking_id OUT NUMBER,p_booking_code OUT VARCHAR2);
PROCEDURE cancel_booking(p_booking_id NUMBER);
PROCEDURE check_in(p_booking_id NUMBER);
PROCEDURE check_out(p_booking_id NUMBER);
END hs_booking_pkg;
/
CREATE OR REPLACE PACKAGE BODY hs_booking_pkg AS
PROCEDURE create_booking(p_customer_id NUMBER,p_room_id NUMBER,p_check_in DATE,p_check_out DATE,p_adults NUMBER,p_children NUMBER,p_booking_id OUT NUMBER,p_booking_code OUT VARCHAR2) IS v_rate NUMBER;v_capacity NUMBER;v_status VARCHAR2(20);v_count NUMBER;v_nights NUMBER;v_dummy NUMBER;
BEGIN
IF p_check_out<=p_check_in OR p_check_in<TRUNC(SYSDATE) THEN RAISE_APPLICATION_ERROR(-20001,'Invalid booking dates.');END IF;
IF p_adults<1 OR NVL(p_children,0)<0 THEN RAISE_APPLICATION_ERROR(-20002,'Invalid guest count.');END IF;
SELECT customer_id INTO v_dummy FROM hs_customers WHERE customer_id=p_customer_id;
SELECT rt.base_rate,rt.capacity,r.status INTO v_rate,v_capacity,v_status FROM hs_rooms r JOIN hs_room_types rt ON rt.room_type_id=r.room_type_id WHERE r.room_id=p_room_id FOR UPDATE OF r.status;
IF v_status IN('MAINTENANCE','INACTIVE') THEN RAISE_APPLICATION_ERROR(-20003,'Room is not bookable.');END IF;
IF p_adults+NVL(p_children,0)>v_capacity THEN RAISE_APPLICATION_ERROR(-20004,'Room capacity exceeded.');END IF;
SELECT COUNT(*) INTO v_count FROM hs_bookings WHERE room_id=p_room_id AND booking_status IN('CONFIRMED','CHECKED_IN') AND p_check_in<check_out AND p_check_out>check_in;
IF v_count>0 THEN RAISE_APPLICATION_ERROR(-20005,'Room already booked for selected dates.');END IF;
v_nights:=TRUNC(p_check_out)-TRUNC(p_check_in);p_booking_code:='HS-'||TO_CHAR(SYSDATE,'YYMMDD')||'-'||LPAD(TO_CHAR(ABS(MOD(DBMS_RANDOM.RANDOM,100000))),5,'0');
INSERT INTO hs_bookings(booking_code,customer_id,room_id,check_in,check_out,adults,children,nightly_rate,total_amount,booking_status) VALUES(p_booking_code,p_customer_id,p_room_id,TRUNC(p_check_in),TRUNC(p_check_out),p_adults,NVL(p_children,0),v_rate,v_rate*v_nights,'CONFIRMED') RETURNING booking_id INTO p_booking_id;
INSERT INTO hs_audit_log(entity_name,entity_id,action_name,details) VALUES('BOOKING',p_booking_id,'CREATE',p_booking_code);
END;
PROCEDURE cancel_booking(p_booking_id NUMBER) IS v_status VARCHAR2(20);BEGIN SELECT booking_status INTO v_status FROM hs_bookings WHERE booking_id=p_booking_id FOR UPDATE;IF v_status<>'CONFIRMED' THEN RAISE_APPLICATION_ERROR(-20006,'Only confirmed bookings can be cancelled.');END IF;UPDATE hs_bookings SET booking_status='CANCELLED' WHERE booking_id=p_booking_id;INSERT INTO hs_audit_log(entity_name,entity_id,action_name) VALUES('BOOKING',p_booking_id,'CANCEL');END;
PROCEDURE check_in(p_booking_id NUMBER) IS v_room NUMBER;BEGIN SELECT room_id INTO v_room FROM hs_bookings WHERE booking_id=p_booking_id AND booking_status='CONFIRMED' FOR UPDATE;UPDATE hs_bookings SET booking_status='CHECKED_IN' WHERE booking_id=p_booking_id;UPDATE hs_rooms SET status='OCCUPIED' WHERE room_id=v_room;INSERT INTO hs_audit_log(entity_name,entity_id,action_name) VALUES('BOOKING',p_booking_id,'CHECK_IN');END;
PROCEDURE check_out(p_booking_id NUMBER) IS v_room NUMBER;BEGIN SELECT room_id INTO v_room FROM hs_bookings WHERE booking_id=p_booking_id AND booking_status='CHECKED_IN' FOR UPDATE;UPDATE hs_bookings SET booking_status='CHECKED_OUT' WHERE booking_id=p_booking_id;UPDATE hs_rooms SET status='CLEANING' WHERE room_id=v_room;INSERT INTO hs_housekeeping_tasks(room_id,task_type,priority,remarks) VALUES(v_room,'CHECKOUT_CLEANING','HIGH','Auto-created on checkout');INSERT INTO hs_audit_log(entity_name,entity_id,action_name) VALUES('BOOKING',p_booking_id,'CHECK_OUT');END;
END hs_booking_pkg;
/
CREATE OR REPLACE PACKAGE hs_customer_pkg AS PROCEDURE create_customer(p_name VARCHAR2,p_email VARCHAR2,p_phone VARCHAR2,p_id OUT NUMBER);END;
/
CREATE OR REPLACE PACKAGE BODY hs_customer_pkg AS PROCEDURE create_customer(p_name VARCHAR2,p_email VARCHAR2,p_phone VARCHAR2,p_id OUT NUMBER) IS BEGIN IF TRIM(p_name) IS NULL OR TRIM(p_email) IS NULL THEN RAISE_APPLICATION_ERROR(-20020,'Name and email required.');END IF;INSERT INTO hs_customers(full_name,email,phone) VALUES(TRIM(p_name),LOWER(TRIM(p_email)),TRIM(p_phone)) RETURNING customer_id INTO p_id;INSERT INTO hs_audit_log(entity_name,entity_id,action_name) VALUES('CUSTOMER',p_id,'CREATE');END;END;
/
CREATE OR REPLACE PACKAGE hs_billing_pkg AS PROCEDURE record_payment(p_booking_id NUMBER,p_amount NUMBER,p_method VARCHAR2,p_reference VARCHAR2,p_id OUT NUMBER);END;
/
CREATE OR REPLACE PACKAGE BODY hs_billing_pkg AS PROCEDURE record_payment(p_booking_id NUMBER,p_amount NUMBER,p_method VARCHAR2,p_reference VARCHAR2,p_id OUT NUMBER) IS v_due NUMBER;BEGIN IF p_amount<=0 THEN RAISE_APPLICATION_ERROR(-20030,'Payment must be positive.');END IF;SELECT due_amount INTO v_due FROM hs_v_payment_summary WHERE booking_id=p_booking_id;IF p_amount>v_due THEN RAISE_APPLICATION_ERROR(-20031,'Payment exceeds due balance.');END IF;INSERT INTO hs_payments(booking_id,amount,payment_method,reference_no) VALUES(p_booking_id,p_amount,UPPER(p_method),p_reference) RETURNING payment_id INTO p_id;INSERT INTO hs_audit_log(entity_name,entity_id,action_name) VALUES('PAYMENT',p_id,'RECORD');END;END;
/
