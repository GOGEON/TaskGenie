# nlp_parser.py
from datetime import datetime
from .ai_service import analyze_task_from_natural_language

class NaturalLanguageParser:
    def parse_task(self, text: str) -> dict:
        """
        Parses a natural language string into a structured task dictionary.
        It uses the AI service for the core analysis and then cleans up the data.
        """
        if not text:
            return None

        # Call the AI service to get the structured data
        ai_result = analyze_task_from_natural_language(text)

        # --- Data Cleaning and Validation ---
        
        # Description: Ensure description is not empty
        if not ai_result.get("description"):
            ai_result["description"] = text # Fallback to original text

        # Priority: Validate priority value
        valid_priorities = ["high", "medium", "low"]
        if ai_result.get("priority") not in valid_priorities:
            ai_result["priority"] = "medium" # Default value

        # Due Date: Ensure it's a valid format or null
        due_date_str = ai_result.get("due_date")
        if due_date_str:
            try:
                # Attempt to parse the date to ensure it's valid
                datetime.fromisoformat(due_date_str.replace(" ", "T"))
            except (ValueError, TypeError):
                ai_result["due_date"] = None # Invalidate if format is wrong

        # Estimated Time: Ensure it's an integer or null
        estimated_time = ai_result.get("estimated_time_minutes")
        if estimated_time is not None and not isinstance(estimated_time, int):
            try:
                ai_result["estimated_time_minutes"] = int(estimated_time)
            except (ValueError, TypeError):
                ai_result["estimated_time_minutes"] = None

        return ai_result

# Create a singleton instance
nlp_parser = NaturalLanguageParser()