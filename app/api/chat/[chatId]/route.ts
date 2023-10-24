import dotenv from "dotenv";
import { NextResponse } from "next/server";
import { Configuration, OpenAIApi } from "openai";
import { currentUser } from "@clerk/nextjs";
import { rateLimit } from "@/lib/rate-limit";
import axios from "axios";
import prismadb from "@/lib/prismadb";

dotenv.config({ path: `.env` });

const configuration = new Configuration({
  apiKey: process.env.OPENAI_API_KEY,
});

const openai = new OpenAIApi(configuration);

export async function POST(request: Request, { params }: { params: { chatId: string } }) {
  try {
    const { prompt } = await request.json();
    const user = await currentUser();

    if (!user || !user.firstName || !user.id) {
      return new NextResponse("Unauthorized", { status: 401 });
    }

    const identifier = request.url + "-" + user.id;
    const { success } = await rateLimit(identifier);

    if (!success) {
      return new NextResponse("Rate limit exceeded", { status: 429 });
    }

    const companion = await prismadb.companion.findUnique({
      where: { id: params.chatId },
    });

    if (!companion || !companion.chatPdfId) {
      return new NextResponse("Companion or ChatPDF ID not found", { status: 404 });
    }

    const formattedChatPdfId = "cha_" + companion.chatPdfId;

    const chatPDFResponse = await axios.post(
      "https://api.chatpdf.com/v1/chats/message",
      {
        sourceId: formattedChatPdfId,
        messages: [
          {
            role: "user",
            content: prompt,
          },
        ],
      },
      {
        headers: {
          "x-api-key": process.env.CHATPDF_API_KEY,
          "Content-Type": "application/json",
        },
      }
    );

    const chatPdfContent = chatPDFResponse.data.content;

    const SYSTEM_MESSAGE = `
    ONLY generate plain sentences. You will be provided the user's input and some information of the book to help with your answer. 
    The user only give you the question and doesn't have any knowledge of the information of the book that was given to you. 
    Use this information to craft your response. Aim to reflect the book's content and author's style while following the given output pattern. 
    The desired output should mirror the character as closely as possible and be approximately twice the length of example outputs provided. 
    Always adhere to the following structure: ${companion.description} [emotion]: [output]. Never have [emotion] more than once. Always mention the author's full name.
    \nRole:\n${companion.instructions}\nOutput Pattern:\n${companion.seed}`;

    const combinedContent = `${prompt} The provided extra information is only to help guide your answer, but this is not in the user's question and they don't know it exists. They only know their prompt: ${chatPdfContent}`;

    const messages = [
      {
        role: "system" as const,
        content: SYSTEM_MESSAGE,
      },
      {
        role: "user" as const,
        content: combinedContent,
      },
    ];

    const gpt3Response = await openai.createChatCompletion({
      model: "gpt-3.5-turbo",
      messages,
    });

    const gpt3Content = gpt3Response.data.choices[0]?.message?.content;

    if (gpt3Content) {
      // Save user's message
      await prismadb.companion.update({
        where: { id: params.chatId },
        data: {
          messages: {
            create: {
              content: prompt,
              role: "user",
              userId: user.id,
            },
          },
        },
      });

      // Save bot's response
      await prismadb.companion.update({
        where: { id: params.chatId },
        data: {
          messages: {
            create: {
              content: gpt3Content,
              role: "system",
              userId: user.id,
            },
          },
        },
      });
    }

    return new NextResponse(gpt3Content);
  } catch (error) {
    if (error instanceof Error) {
      console.error('[CONVERSATION_ERROR]', error.message);
      return new NextResponse(error.message, { status: 500 });
    } else {
      console.error('[CONVERSATION_ERROR]', 'An unknown error occurred.');
      return new NextResponse("Internal Error", { status: 500 });
    }
  }
};
