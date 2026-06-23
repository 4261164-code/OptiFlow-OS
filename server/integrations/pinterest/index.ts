import axios from "axios";

export async function publishToPinterest(pin: any) {
  const pinterestToken = process.env.PINTEREST_TOKEN;

  if (!pinterestToken) {
    throw new Error("Missing Pinterest token in environment");
  }

  const response = await axios.post(
    "https://api.pinterest.com/v5/pins",
    {
      title: pin.title,
      description: pin.description,
      link: pin.url,
      media_source: {
        source_type: "image_url",
        url: pin.image
      }
    },
    {
      headers: {
        Authorization: `Bearer ${pinterestToken}`
      }
    }
  );

  return response.data;
}
