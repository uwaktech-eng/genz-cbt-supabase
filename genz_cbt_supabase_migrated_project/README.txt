GENZ CBT PRO - UPDATED PACKAGE

New in this package:
- Subadmin action token now supports timed access sessions.
- Principal admin can set the token and its expiry time in minutes.
- Subadmin activates a timed token session from the admin settings panel before protected actions.
- Public site upgraded with:
  - favicon / browser tab image URL support
  - homepage hero content
  - about section
  - CEO profile section
  - contributors section
  - institutions using Genz CBT Pro section
  - testimonials section with image/video links
  - tutorial videos / playlists section
  - social media handles section
  - About, Terms, Privacy, Cookies, and Contact pages

Important settings you can now edit from the Admin Portal > Portal Settings:
- Result Brand Name
- Brand Logo Image URL
- Signature Image URL
- Browser Tab Icon / Favicon URL
- Homepage hero title, subtitle, and badge
- About title and content
- CEO name, title, image URL, and bio
- Contributors JSON
- Institutions JSON
- Testimonials JSON
- Tutorial Videos / Playlists JSON
- Social Handles JSON
- Contact email, phone, and address
- Terms, Privacy, and Cookies text
- Subadmin Token Session Expiry (Minutes)

Sample JSON formats:
Contributors JSON:
[
  {"name":"Jane Doe","role":"Lead Developer","imageUrl":"https://example.com/jane.jpg","bio":"Platform architect and contributor."}
]

Institutions JSON:
[
  {"name":"The Broadoak Schools","logoUrl":"https://example.com/logo.png","location":"Owerri"}
]

Testimonials JSON:
[
  {"name":"Parent Name","role":"Parent","quote":"Excellent CBT experience.","imageUrl":"https://example.com/photo.jpg","videoUrl":"https://www.youtube.com/watch?v=VIDEOID"}
]

Tutorial Videos / Playlists JSON:
[
  {"title":"How to use Genz CBT","videoUrl":"https://www.youtube.com/watch?v=VIDEOID","thumbUrl":"https://example.com/thumb.jpg","description":"Quick walkthrough"}
]

Social Handles JSON:
[
  {"label":"WhatsApp","url":"https://wa.me/234..."},
  {"label":"Instagram","url":"https://instagram.com/yourhandle"},
  {"label":"LinkedIn","url":"https://linkedin.com/in/yourhandle"}
]

Deployment notes:
1. Paste all updated files into your project.
2. Save the project.
3. Run authorizeDriveAccess_() once if needed.
4. Deploy a new web app version.
5. Hard refresh the browser.
