# CBA curriculum

The active catalogue contains Business Fundamentals & Corporate Structure, Financial Literacy for Professionals, and Marketing and Customer Relationship Management, with 11 sections. Each section now has three lessons: core teaching, a worked case study and a practical workshop, giving 33 lessons in total. Lessons include objectives, teaching notes, workplace examples, practice activities and takeaways. Each course has ten scenario/concept/calculation questions with explanations and one assignment with review criteria. Content is intended for early-career professionals with 2–5 years of experience.

`curriculum.ts` exports the expanded seed catalogue. Run `npm run db:seed` after `npm run db:migrate`. Missing courses are inserted; archived courses remain archived. A one-time expansion adds the new case/workshop lessons to existing modules while preserving existing lesson IDs, content edits, course details and quizzes. It saves history and records an installation receipt. Later seed reruns do not reinstall lessons an admin removes. Removed modules are not recreated. Edit the database-backed material through `/admin/courses`; seed source changes do not automatically replace saved content.

Course documents are validated before saving. A saved draft withdraws that course from learner visibility until published again. History snapshots preserve prior versions; restoring creates a draft. Concurrent edits return a conflict instead of silently overwriting a newer version. Active quiz attempts retain their own assessment snapshot.

The material is an expanded teaching draft for the academy to review. It does not claim external accreditation or invent videos, faculty credentials or outcome statistics. Financial examples are fictional. Tax lessons cover process and records rather than fixed rates or deadlines, which need current professional confirmation.

## Further reading checked during authoring

- [Corporate Affairs Commission: business names](https://www.cac.gov.ng/services/business-name) — official registration resource.
- [Financial Reporting Council publications](https://frcnigeria.gov.ng/publications/) — governance reference and scope review.
- [Nigeria Revenue Service](https://www.nrs.gov.ng/) — current federal tax guidance.
- [CISA Secure Our World](https://www.cisa.gov/secure-our-world) — phishing, account protection and awareness resources.
- [Official Scrum Guide](https://scrumguides.org/scrum-guide.html) — the source for the introductory Scrum terminology.

These references are further reading; the lessons are original explanations, not reproductions of those publications. Link selection does not imply endorsement or permission to redistribute third-party resources.
