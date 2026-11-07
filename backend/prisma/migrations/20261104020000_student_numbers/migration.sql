ALTER TABLE "mowe_lms"."lms_auth_users" ADD COLUMN "studentNumber" TEXT;
CREATE SEQUENCE "mowe_lms"."student_number_seq" START WITH 557;

WITH learners AS (
  SELECT id, 'MOWE' || nextval('mowe_lms.student_number_seq')::text AS number
  FROM (SELECT id FROM "mowe_lms"."lms_auth_users" WHERE role = 'STUDENT' ORDER BY "createdAt", id) ordered
)
UPDATE "mowe_lms"."lms_auth_users" u SET "studentNumber" = learners.number FROM learners WHERE u.id = learners.id;

CREATE UNIQUE INDEX "lms_auth_users_studentNumber_key" ON "mowe_lms"."lms_auth_users"("studentNumber");
CREATE FUNCTION "mowe_lms"."assign_student_number"() RETURNS trigger LANGUAGE plpgsql AS $$
BEGIN
  IF NEW.role = 'STUDENT' THEN
    IF TG_OP = 'UPDATE' AND OLD.role = 'STUDENT' AND OLD."studentNumber" IS NOT NULL THEN
      NEW."studentNumber" := OLD."studentNumber";
    ELSE
      NEW."studentNumber" := 'MOWE' || nextval('mowe_lms.student_number_seq')::text;
    END IF;
  ELSE
    NEW."studentNumber" := NULL;
  END IF;
  RETURN NEW;
END;
$$;
CREATE TRIGGER "assign_student_number" BEFORE INSERT OR UPDATE OF role, "studentNumber"
ON "mowe_lms"."lms_auth_users" FOR EACH ROW EXECUTE FUNCTION "mowe_lms"."assign_student_number"();
