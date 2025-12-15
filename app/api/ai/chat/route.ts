import { NextRequest, NextResponse } from "next/server";
import { requireAuth } from "@/lib/auth";
import { tools } from "@/lib/ai/tools";

interface Message {
  role: "user" | "assistant" | "system";
  content: string;
}

export async function POST(request: NextRequest) {
  try {
    const user = await requireAuth();
    const { messages } = await request.json() as { messages: Message[] };

    if (!process.env.OPENROUTER_API_KEY) {
      return NextResponse.json(
        { error: "OpenRouter API key not configured" },
        { status: 500 }
      );
    }

    // System message with tool descriptions
    const systemMessage = {
      role: "system",
      content: `You are a helpful AI finance assistant. You have access to the following tools to help users with their finances:

${tools.map((tool) => `- ${tool.name}: ${tool.description}`).join("\n")}

When the user asks a question:
1. Determine if you need to use any tools to answer
2. If yes, respond with TOOL_CALL: followed by the tool name and arguments in JSON format
3. If no, respond directly to the user

Example tool call format:
TOOL_CALL: {"name": "get_account_balance", "args": {}}
TOOL_CALL: {"name": "search_transactions", "args": {"startDate": "2024-01-01", "endDate": "2024-01-31"}}

Be conversational, helpful, and provide insights based on the data.`,
    };

    // Call OpenRouter API
    const response = await fetch("https://openrouter.ai/api/v1/chat/completions", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${process.env.OPENROUTER_API_KEY}`,
        "HTTP-Referer": process.env.NEXTAUTH_URL || "http://localhost:3000",
        "X-Title": "Finance Copilot",
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "anthropic/claude-3.5-sonnet",
        messages: [systemMessage, ...messages],
        temperature: 0.7,
        max_tokens: 2000,
      }),
    });

    if (!response.ok) {
      const error = await response.text();
      console.error("OpenRouter error:", error);
      return NextResponse.json(
        { error: "Failed to get AI response" },
        { status: response.status }
      );
    }

    const data = await response.json();
    let assistantMessage = data.choices[0].message.content;

    // Check if the response contains tool calls
    const toolCalls = [];
    const toolCallMatches = assistantMessage.match(/TOOL_CALL:\s*({[^}]+})/g);

    if (toolCallMatches) {
      // Execute tool calls
      for (const match of toolCallMatches) {
        try {
          const toolCallJson = match.replace("TOOL_CALL:", "").trim();
          const toolCall = JSON.parse(toolCallJson);
          const tool = tools.find((t) => t.name === toolCall.name);

          if (tool) {
            const result = await tool.execute(toolCall.args, user.id);
            toolCalls.push({
              name: toolCall.name,
              args: toolCall.args,
              result,
            });

            // Remove tool call from message
            assistantMessage = assistantMessage.replace(match, "");
          }
        } catch (err) {
          console.error("Tool execution error:", err);
        }
      }

      // If we executed tools, make another call to format the results
      if (toolCalls.length > 0) {
        const toolResultsMessage = {
          role: "assistant",
          content: `Tool results:\n${toolCalls.map((tc) => `${tc.name}: ${JSON.stringify(tc.result, null, 2)}`).join("\n\n")}

Please provide a natural, conversational response to the user based on these results.`,
        };

        const finalResponse = await fetch("https://openrouter.ai/api/v1/chat/completions", {
          method: "POST",
          headers: {
            "Authorization": `Bearer ${process.env.OPENROUTER_API_KEY}`,
            "HTTP-Referer": process.env.NEXTAUTH_URL || "http://localhost:3000",
            "X-Title": "Finance Copilot",
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            model: "anthropic/claude-3.5-sonnet",
            messages: [systemMessage, ...messages, toolResultsMessage],
            temperature: 0.7,
            max_tokens: 2000,
          }),
        });

        if (finalResponse.ok) {
          const finalData = await finalResponse.json();
          assistantMessage = finalData.choices[0].message.content;
        }
      }
    }

    return NextResponse.json({
      message: assistantMessage.trim(),
      toolCalls: toolCalls.length > 0 ? toolCalls : undefined,
    });
  } catch (error) {
    console.error("Chat API error:", error);
    return NextResponse.json(
      { error: "An error occurred processing your request" },
      { status: 500 }
    );
  }
}
