/**
 * Shared LLM client factory.
 * Single point of creation — future BYOK key injection happens here.
 */
const Anthropic = require('@anthropic-ai/sdk');
const OpenAI = require('openai');

function getAnthropicClient(apiKey) {
  return new Anthropic({ apiKey: apiKey || process.env.ANTHROPIC_API_KEY });
}

function getOpenAIClient(apiKey) {
  return new OpenAI({ apiKey: apiKey || process.env.OPENAI_API_KEY });
}

module.exports = { getAnthropicClient, getOpenAIClient };
