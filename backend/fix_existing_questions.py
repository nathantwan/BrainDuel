from database import SessionLocal
from models import Question, QuestionOption
import uuid

def fix_existing_questions():
    db = SessionLocal()
    try:
        # Get questions without options
        questions = db.query(Question).all()
        questions_without_options = []
        for q in questions:
            if len(q.options) == 0:
                questions_without_options.append(q)
        questions = questions_without_options
        
        print(f"Found {len(questions)} questions without options")
        
        for q in questions:
            print(f"Fixing question: {q.question_text[:50]}... (type: {q.question_type})")
            
            if q.question_type == "true_false":
                # Add True/False options
                true_option = QuestionOption(
                    id=uuid.uuid4(),
                    question_id=q.id,
                    option_letter="A",
                    option_text="True",
                    is_correct=(q.correct_answer.lower() == "true")
                )
                false_option = QuestionOption(
                    id=uuid.uuid4(),
                    question_id=q.id,
                    option_letter="B",
                    option_text="False",
                    is_correct=(q.correct_answer.lower() == "false")
                )
                db.add(true_option)
                db.add(false_option)
                print(f"  Added True/False options for question {q.id}")
                
            elif q.question_type == "short_answer":
                # Add generic options with correct answer as first option
                options = [
                    q.correct_answer,
                    "Option B",
                    "Option C",
                    "Option D"
                ]
                for i, option_text in enumerate(options):
                    option = QuestionOption(
                        id=uuid.uuid4(),
                        question_id=q.id,
                        option_letter=chr(65 + i),  # A, B, C, D
                        option_text=option_text,
                        is_correct=(i == 0)  # First option is correct
                    )
                    db.add(option)
                print(f"  Added 4 options for short answer question {q.id}")
                
            elif q.question_type == "multiple_choice":
                # This shouldn't happen, but add generic options if it does
                options = ["Option A", "Option B", "Option C", "Option D"]
                for i, option_text in enumerate(options):
                    option = QuestionOption(
                        id=uuid.uuid4(),
                        question_id=q.id,
                        option_letter=chr(65 + i),
                        option_text=option_text,
                        is_correct=(i == 0)
                    )
                    db.add(option)
                print(f"  Added generic options for multiple choice question {q.id}")
        
        db.commit()
        print(f"Successfully fixed {len(questions)} questions")
        
    except Exception as e:
        print(f"Error: {e}")
        db.rollback()
    finally:
        db.close()

if __name__ == "__main__":
    fix_existing_questions() 