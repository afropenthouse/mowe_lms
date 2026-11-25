# CBA curriculum

The developer-maintained catalogue contains courses 1–8 and 27 Genially presentations in the workbook order. Presentation titles and IDs are defined in `interactive-lessons.ts`. Each course includes its existing quiz and workplace assignment.

Run `npm run db:migrate` and then `npm run db:seed` in the backend before deploying the catalogue. The import publishes the eight courses, uses the original core lesson IDs, and retains existing quizzes, assignments and matching lesson data. Earlier versions of the curriculum are saved in course history. Importing again applies the code-defined lesson titles, links and order.

Courses unlock sequentially by default (`OPEN_COURSE_ACCESS=false`). Learners must finish the current course's lessons, pass its quiz with at least 70% (or its higher configured pass mark), and receive a grade for its assignment when assignments are required before the next course opens. The configured payment requirement also applies. Set `OPEN_COURSE_ACCESS=true` only to temporarily open every course, and restart the backend after changing this setting. Checkout pricing defaults to ₦100,000 per course or ₦700,000 for all eight, and administrators can edit prices in Payments.
## Further reading checked during authoring

- [Corporate Affairs Commission: business names](https://www.cac.gov.ng/services/business-name) — official registration resource.
- [Financial Reporting Council publications](https://frcnigeria.gov.ng/publications/) — governance reference and scope review.
- [Nigeria Revenue Service](https://www.nrs.gov.ng/) — current federal tax guidance.
- [CISA Secure Our World](https://www.cisa.gov/secure-our-world) — phishing, account protection and awareness resources.
- [Official Scrum Guide](https://scrumguides.org/scrum-guide.html) — the source for the introductory Scrum terminology.

These references are further reading; the lessons are original explanations, not reproductions of those publications. Link selection does not imply endorsement or permission to redistribute third-party resources.
