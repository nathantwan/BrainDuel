# services/question_generator.py
import json
from typing import List, Dict
import asyncio
import aiohttp
from dotenv import load_dotenv
import os

load_dotenv()

class QuestionGenerator:
    def __init__(self):
        self.api_key = os.getenv("GROK_API_KEY")
        self.api_url = "https://api.groq.com/openai/v1/chat/completions"
        self.model = "meta-llama/llama-4-scout-17b-16e-instruct"

    async def generate_questions(
        self, 
        content: str, 
        count: int = 10, 
        difficulty: str = "medium"
    ) -> List[Dict]:
        """Generate questions from content using Groq AI"""
        
        prompt = f"""
        Based on the following study material, generate {count} {difficulty} level questions.
        
        For each question, provide the response in this exact JSON format:
        [
            {{
                "question": "Question text here",
                "type": "multiple_choice",
                "correct_answer": "The exact text of the correct option",
                "options": [
                    "Option A text",
                    "Option B text", 
                    "Option C text",
                    "Option D text"
                ],
                "explanation": "Explanation why this answer is correct",
                "topic": "Subject area"
            }},
            {{
                "question": "Another question",
                "type": "true_false",
                "correct_answer": "True",
                "explanation": "Explanation",
                "topic": "Subject area"
            }}
        ]
        
        IMPORTANT RULES:
        1. For multiple choice questions, provide exactly 4 options as an array
        2. Each option should be a complete, meaningful answer
        3. The correct_answer should be the EXACT text of the correct option
        4. Do NOT use placeholder text like "Option A", "Option B", etc.
        5. Make sure all options are plausible but only one is correct
        6. Question types should be: multiple_choice, true_false, or short_answer
        7. Difficulty level: {difficulty}
        
        Study Material:
        {content[:4000]}
        
        Return ONLY the JSON array, no other text.
        """
        
        headers = {
            "Content-Type": "application/json",
            "Authorization": f"Bearer {self.api_key}"
        }
        
        payload = {
            "model": self.model,
            "messages": [
                {
                    "role": "user",
                    "content": prompt
                }
            ],
            "temperature": 0.7,
            "max_tokens": 2000
        }
        
        try:
            async with aiohttp.ClientSession() as session:
                async with session.post(
                    self.api_url, 
                    headers=headers, 
                    json=payload
                ) as response:
                    if response.status != 200:
                        error_text = await response.text()
                        raise Exception(f"Groq API error {response.status}: {error_text}")
                    
                    response_data = await response.json()
                    
                    # Extract the generated content
                    questions_json = response_data["choices"][0]["message"]["content"]
                    
                    # Clean up the response (remove any markdown formatting)
                    questions_json = questions_json.strip()
                    if questions_json.startswith("```json"):
                        questions_json = questions_json[7:]
                    if questions_json.endswith("```"):
                        questions_json = questions_json[:-3]
                    
                    # Parse JSON
                    questions = json.loads(questions_json)
                    
                    # Validate and ensure we have the right number of questions
                    if not isinstance(questions, list):
                        raise Exception("Generated response is not a valid JSON array")
                    
                    # Post-process questions to ensure proper format
                    processed_questions = []
                    for question in questions[:count]:
                        if question.get("type") == "multiple_choice":
                            # Ensure options is a list
                            if isinstance(question.get("options"), dict):
                                # Convert dict format to list format
                                options_dict = question["options"]
                                options_list = []
                                for key in ["A", "B", "C", "D"]:
                                    if key in options_dict:
                                        options_list.append(options_dict[key])
                                question["options"] = options_list
                            
                            # Ensure we have exactly 4 options
                            if len(question.get("options", [])) != 4:
                                print(f"Warning: Question has {len(question.get('options', []))} options, expected 4")
                                continue
                            
                            # Ensure correct_answer is the actual text, not just a letter
                            correct_answer = question.get("correct_answer", "")
                            if correct_answer in ["A", "B", "C", "D"]:
                                # Convert letter to actual answer text
                                try:
                                    index = ord(correct_answer) - ord("A")
                                    if 0 <= index < len(question["options"]):
                                        question["correct_answer"] = question["options"][index]
                                except (IndexError, TypeError):
                                    print(f"Warning: Could not convert letter {correct_answer} to answer text")
                                    continue
                        
                        processed_questions.append(question)
                    
                    return processed_questions
                    
        except json.JSONDecodeError as e:
            raise Exception(f"Failed to parse AI response as JSON: {str(e)}")
        except aiohttp.ClientError as e:
            raise Exception(f"Network error calling Groq API: {str(e)}")
        except KeyError as e:
            raise Exception(f"Unexpected API response format: {str(e)}")
        except Exception as e:
            raise Exception(f"Failed to generate questions: {str(e)}")

    async def test_connection(self) -> bool:
        """Test if the Groq API connection works"""
        try:
            headers = {
                "Content-Type": "application/json",
                "Authorization": f"Bearer {self.api_key}"
            }
            
            payload = {
                "model": self.model,
                "messages": [
                    {
                        "role": "user",
                        "content": "Say hello"
                    }
                ],
                "max_tokens": 10
            }
            
            async with aiohttp.ClientSession() as session:
                async with session.post(
                    self.api_url, 
                    headers=headers, 
                    json=payload
                ) as response:
                    return response.status == 200
                    
        except Exception:
            return False