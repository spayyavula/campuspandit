# UTM convention for CampusPandit social posts

Every link from a LinkedIn or Twitter post to `www.campuspandit.ai` MUST follow this format:

    https://www.campuspandit.ai/<path>?utm_source=<linkedin|twitter>&utm_medium=social&utm_campaign=<post_topic>

`post_topic` MUST match the `post_topic` value you enter into the `engagement_signals` row for that post.

Seed `post_topic` values:
- `b2b-pitch` — main Founding 10 announcement on LinkedIn
- `roadmap-launch` — when /roadmap goes live
- `blog-share-b2b` — when a coaching-center-targeted blog post is shared
- `blog-share-student` — when a student-targeted blog post is shared
- `materials-share` — when a /materials resource is referenced
- `founder-story` — personal narrative content

Example:
- `https://www.campuspandit.ai/?utm_source=linkedin&utm_medium=social&utm_campaign=b2b-pitch`
- `https://www.campuspandit.ai/blog/jee-prep-the-honest-version?utm_source=twitter&utm_medium=social&utm_campaign=blog-share-student`

Plausible automatically reports `utm_source` / `utm_medium` / `utm_campaign` breakdowns in its dashboard.
