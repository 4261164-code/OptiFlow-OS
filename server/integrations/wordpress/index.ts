import axios from "axios";

export async function publishToWordPress(post: any) {
  const wpUrl = process.env.WP_URL;
  const wpUser = process.env.WP_USER;
  const wpPassword = process.env.WP_APP_PASSWORD;

  if (!wpUrl || !wpUser || !wpPassword) {
    throw new Error("Missing WordPress credentials in environment");
  }

  const response = await axios.post(
    `${wpUrl}/wp-json/wp/v2/posts`,
    {
      title: post.title,
      content: post.article,
      status: "publish"
    },
    {
      auth: {
        username: wpUser,
        password: wpPassword
      }
    }
  );

  return response.data;
}
