"""
Spaced Repetition System (SRS) - SM-2 Algorithm Implementation
"""

from datetime import datetime, timedelta
from typing import Dict, Tuple
import math


class SM2Algorithm:
    """SM-2 algorithm for spaced repetition."""
    
    DEFAULT_EASE_FACTOR = 2.5
    MIN_EASE_FACTOR = 1.3
    DEFAULT_INTERVAL = 1
    
    @staticmethod
    def calculate_new_ease_factor(current_ease: float, quality: int) -> float:
        """Calculate new ease factor based on review quality."""
        new_ease = current_ease + (0.1 - (5 - quality) * (0.08 + (5 - quality) * 0.02))
        return max(SM2Algorithm.MIN_EASE_FACTOR, new_ease)
    
    @staticmethod
    def calculate_new_interval(current_interval: int, ease_factor: float, 
                                quality: int, repetition_number: int) -> int:
        """Calculate the new interval for the next review."""
        if quality < 3:
            return 1
        
        if repetition_number == 0:
            new_interval = 1
        elif repetition_number == 1:
            new_interval = 6
        else:
            new_interval = math.ceil(current_interval * ease_factor)
        
        return min(new_interval, 365)
    
    @staticmethod
    def calculate_next_review_date(interval: int) -> datetime:
        """Calculate the next review date based on interval."""
        return datetime.now() + timedelta(days=interval)
    
    @staticmethod
    def process_review(current_ease: float, current_interval: int,
                       quality: int, repetition_number: int) -> Tuple[float, int, datetime, int]:
        """Process a review and return updated SRS parameters."""
        new_ease = SM2Algorithm.calculate_new_ease_factor(current_ease, quality)
        
        if quality < 3:
            new_repetition_number = 0
        else:
            new_repetition_number = repetition_number + 1
        
        new_interval = SM2Algorithm.calculate_new_interval(
            current_interval, new_ease, quality, new_repetition_number)
        next_review_date = SM2Algorithm.calculate_next_review_date(new_interval)
        
        return new_ease, new_interval, next_review_date, new_repetition_number
    
    @staticmethod
    def map_button_to_quality(button: str) -> int:
        """Map user button press to SM-2 quality rating."""
        button_mapping = {'again': 0, 'hard': 2, 'good': 4, 'easy': 5}
        return button_mapping.get(button.lower(), 3)
    
    @staticmethod
    def get_button_intervals(current_interval: int, ease_factor: float,
                             repetition_number: int) -> Dict[str, int]:
        """Calculate preview intervals for each button option."""
        buttons = ['again', 'hard', 'good', 'easy']
        intervals = {}
        
        for button in buttons:
            quality = SM2Algorithm.map_button_to_quality(button)
            new_ease = SM2Algorithm.calculate_new_ease_factor(ease_factor, quality)
            
            if quality < 3:
                intervals[button] = 1
            else:
                temp_rep = repetition_number + 1
                intervals[button] = SM2Algorithm.calculate_new_interval(
                    current_interval, new_ease, quality, temp_rep)
        
        return intervals
    
    @staticmethod
    def format_interval(days: int) -> str:
        """Format interval in human-readable format."""
        if days < 1:
            return "<1d"
        elif days == 1:
            return "1d"
        elif days < 7:
            return f"{days}d"
        elif days < 30:
            return f"{days // 7}w"
        elif days < 365:
            return f"{days // 30}mo"
        else:
            return f"{days // 365}y"
