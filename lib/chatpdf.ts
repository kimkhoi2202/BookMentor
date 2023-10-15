import axios, { AxiosError } from "axios";

const CHATPDF_API_ENDPOINT = "https://api.chatpdf.com/v1";
const CHATPDF_API_KEY = process.env.CHATPDF_API_KEY;

const headers = {
  "x-api-key": CHATPDF_API_KEY,
  "Content-Type": "application/json",
};

interface ChatPdfResponse {
  content: string;
}

export const chatWithPdf = async (sourceId: string, messages: { role: string; content: string }[]): Promise<string> => {
  try {
    const response = await axios.post<ChatPdfResponse>(
      `${CHATPDF_API_ENDPOINT}/chats/message`,
      { sourceId, messages },
      { headers }
    );

    return response.data.content || "";
  } catch (error) {
    console.error("Error:", (error as AxiosError).message);
    console.log("Response:", (error as AxiosError).response?.data);
    throw error;
  }
};
