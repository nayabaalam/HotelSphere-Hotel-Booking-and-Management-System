SET SERVEROUTPUT ON;
DECLARE c NUMBER;r NUMBER;i NUMBER;code VARCHAR2(24);
BEGIN
SELECT customer_id INTO c FROM hs_customers WHERE email='meera@example.com';
SELECT room_id INTO r FROM hs_rooms WHERE room_number='101';
hs_booking_pkg.create_booking(c,r,TRUNC(SYSDATE)+7,TRUNC(SYSDATE)+9,2,0,i,code);
DBMS_OUTPUT.PUT_LINE('Created demo booking '||code||' ID='||i);
ROLLBACK;
EXCEPTION WHEN OTHERS THEN ROLLBACK;DBMS_OUTPUT.PUT_LINE(SQLERRM);RAISE;
END;
/
