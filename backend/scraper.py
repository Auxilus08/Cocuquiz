"""
DBMS Quiz Scraper
Scrapes multiple-choice questions from Sanfoundry DBMS pages.
"""

import requests
from bs4 import BeautifulSoup
import json
import time
import re
import logging
from typing import List, Dict, Optional

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

# List of Sanfoundry DBMS MCQ URLs to scrape
DBMS_URLS = [
    "https://www.sanfoundry.com/database-mcqs-sql-basics-definitions/",
    "https://www.sanfoundry.com/database-mcqs-sql-queries/",
    "https://www.sanfoundry.com/database-mcqs-basic-sql-queries-1/",
    "https://www.sanfoundry.com/database-mcqs-basic-sql-queries-2/",
    "https://www.sanfoundry.com/database-mcqs-set-operations/",
    "https://www.sanfoundry.com/database-mcqs-null-values/",
    "https://www.sanfoundry.com/database-mcqs-aggregate-functions/",
    "https://www.sanfoundry.com/database-mcqs-nested-subqueries/",
    "https://www.sanfoundry.com/database-mcqs-modification-database/",
    "https://www.sanfoundry.com/database-mcqs-join-expressions/",
    "https://www.sanfoundry.com/database-mcqs-views/",
    "https://www.sanfoundry.com/database-mcqs-transactions/",
    "https://www.sanfoundry.com/database-mcqs-integrity-constraints/",
    "https://www.sanfoundry.com/database-mcqs-sql-data-types-schemas/",
    "https://www.sanfoundry.com/database-mcqs-authorization/",
    "https://www.sanfoundry.com/database-mcqs-er-model/",
    "https://www.sanfoundry.com/database-mcqs-constraints/",
    "https://www.sanfoundry.com/database-mcqs-entity-sets/",
    "https://www.sanfoundry.com/database-mcqs-relationship-sets/",
    "https://www.sanfoundry.com/database-mcqs-keys/",
    "https://www.sanfoundry.com/database-mcqs-design-issues/",
    "https://www.sanfoundry.com/database-mcqs-weak-entity-sets/",
    "https://www.sanfoundry.com/database-mcqs-extended-er-features/",
    "https://www.sanfoundry.com/database-mcqs-reduction-er-schema-tables/",
    "https://www.sanfoundry.com/database-mcqs-normalization/",
    "https://www.sanfoundry.com/database-mcqs-first-normal-form/",
    "https://www.sanfoundry.com/database-mcqs-second-normal-form/",
    "https://www.sanfoundry.com/database-mcqs-third-normal-form/",
    "https://www.sanfoundry.com/database-mcqs-bcnf/",
    "https://www.sanfoundry.com/database-mcqs-fourth-normal-form/",
]

# Request headers to mimic a browser
HEADERS = {
    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
    'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
    'Accept-Language': 'en-US,en;q=0.5',
    'Connection': 'keep-alive',
}


def extract_category_from_url(url: str) -> str:
    """Extract category name from URL."""
    # Get the last part of the URL and clean it
    match = re.search(r'database-mcqs-(.+)/$', url)
    if match:
        category = match.group(1).replace('-', ' ').title()
        return category
    return "General DBMS"


def clean_text(text: str) -> str:
    """Clean and normalize text."""
    if not text:
        return ""
    # Remove extra whitespace
    text = re.sub(r'\s+', ' ', text)
    # Remove leading/trailing whitespace
    text = text.strip()
    return text


def parse_question_block(block) -> Optional[Dict]:
    """
    Parse a question block from Sanfoundry page.
    Returns a dictionary with question, options, answer, and explanation.
    """
    try:
        question_data = {
            'question': '',
            'options': {},
            'answer': '',
            'explanation': ''
        }
        
        # Get all paragraph elements
        paragraphs = block.find_all(['p', 'div'])
        
        question_text = ""
        options = {}
        answer = ""
        explanation = ""
        
        for elem in block.descendants:
            if isinstance(elem, str):
                text = clean_text(elem)
                if not text:
                    continue
                    
                # Check for question number pattern (e.g., "1. ", "2. ")
                if re.match(r'^\d+\.\s', text):
                    question_text = re.sub(r'^\d+\.\s*', '', text)
                
                # Check for options (a), b), c), d) or a. b. c. d.)
                option_match = re.match(r'^([a-d])[\.\)]\s*(.+)', text, re.IGNORECASE)
                if option_match:
                    option_letter = option_match.group(1).lower()
                    option_text = option_match.group(2)
                    options[option_letter] = option_text
                
                # Check for answer
                if 'answer:' in text.lower():
                    answer_match = re.search(r'answer:\s*([a-d])', text, re.IGNORECASE)
                    if answer_match:
                        answer = answer_match.group(1).lower()
                
                # Check for explanation
                if 'explanation:' in text.lower() or 'clarification:' in text.lower():
                    exp_match = re.search(r'(?:explanation|clarification):\s*(.+)', text, re.IGNORECASE)
                    if exp_match:
                        explanation = exp_match.group(1)
        
        # Alternative parsing for collapsible sections
        collapsible = block.find('div', class_='collapseomatic_content')
        if collapsible:
            collapsible_text = collapsible.get_text()
            if 'answer:' in collapsible_text.lower():
                answer_match = re.search(r'answer:\s*([a-d])', collapsible_text, re.IGNORECASE)
                if answer_match:
                    answer = answer_match.group(1).lower()
            if 'explanation:' in collapsible_text.lower() or 'clarification:' in collapsible_text.lower():
                exp_match = re.search(r'(?:explanation|clarification):\s*(.+?)(?=\n|$)', collapsible_text, re.IGNORECASE | re.DOTALL)
                if exp_match:
                    explanation = clean_text(exp_match.group(1))
        
        if question_text and len(options) >= 2 and answer:
            question_data['question'] = question_text
            question_data['options'] = options
            question_data['answer'] = answer
            question_data['explanation'] = explanation if explanation else "No explanation available."
            return question_data
        
        return None
        
    except Exception as e:
        logger.error(f"Error parsing question block: {e}")
        return None


def scrape_page(url: str) -> List[Dict]:
    """
    Scrape a single Sanfoundry page for MCQs.
    """
    questions = []
    category = extract_category_from_url(url)
    
    try:
        logger.info(f"Scraping: {url}")
        response = requests.get(url, headers=HEADERS, timeout=30)
        response.raise_for_status()
        
        soup = BeautifulSoup(response.text, 'html.parser')
        
        # Find the main content area
        content = soup.find('div', class_='entry-content')
        if not content:
            content = soup.find('article')
        if not content:
            content = soup
        
        # Get all text content
        full_text = content.get_text()
        
        # Split by question numbers
        question_pattern = r'(?=\d+\.\s+)'
        question_blocks = re.split(question_pattern, full_text)
        
        for block in question_blocks:
            if not block.strip():
                continue
                
            question_data = {
                'question': '',
                'options': {},
                'answer': '',
                'explanation': '',
                'category': category
            }
            
            lines = block.strip().split('\n')
            current_section = 'question'
            
            for line in lines:
                line = clean_text(line)
                if not line:
                    continue
                
                # Check if this is the question line
                q_match = re.match(r'^\d+\.\s*(.+)', line)
                if q_match and not question_data['question']:
                    question_data['question'] = q_match.group(1)
                    continue
                
                # Check for options
                option_match = re.match(r'^([a-d])[\.\)]\s*(.+)', line, re.IGNORECASE)
                if option_match:
                    option_letter = option_match.group(1).lower()
                    option_text = option_match.group(2)
                    question_data['options'][option_letter] = option_text
                    continue
                
                # Check for answer
                answer_match = re.search(r'(?:answer|ans)[\s:]*([a-d])', line, re.IGNORECASE)
                if answer_match:
                    question_data['answer'] = answer_match.group(1).lower()
                    continue
                
                # Check for explanation
                exp_match = re.match(r'(?:explanation|clarification)[\s:]*(.+)', line, re.IGNORECASE)
                if exp_match:
                    question_data['explanation'] = exp_match.group(1)
                    continue
                
                # If we have an answer but no explanation yet, this might be the explanation
                if question_data['answer'] and not question_data['explanation']:
                    if 'view answer' not in line.lower() and 'advertisement' not in line.lower():
                        question_data['explanation'] += ' ' + line
            
            # Validate and add question
            if (question_data['question'] and 
                len(question_data['options']) >= 2 and 
                question_data['answer']):
                
                # Clean up explanation
                question_data['explanation'] = clean_text(question_data['explanation'])
                if not question_data['explanation']:
                    question_data['explanation'] = "No explanation provided."
                
                questions.append(question_data)
        
        logger.info(f"Found {len(questions)} questions from {url}")
        
    except requests.RequestException as e:
        logger.error(f"Request error for {url}: {e}")
    except Exception as e:
        logger.error(f"Error scraping {url}: {e}")
    
    return questions


def scrape_all_pages(urls: List[str] = None, delay: float = 2.5) -> List[Dict]:
    """
    Scrape all pages from the URL list.
    
    Args:
        urls: List of URLs to scrape (defaults to DBMS_URLS)
        delay: Delay between requests in seconds
    
    Returns:
        List of all scraped questions
    """
    if urls is None:
        urls = DBMS_URLS
    
    all_questions = []
    
    for i, url in enumerate(urls):
        logger.info(f"Processing page {i + 1}/{len(urls)}")
        
        questions = scrape_page(url)
        all_questions.extend(questions)
        
        # Rate limiting - be respectful to the server
        if i < len(urls) - 1:
            logger.info(f"Waiting {delay} seconds before next request...")
            time.sleep(delay)
    
    logger.info(f"Total questions scraped: {len(all_questions)}")
    return all_questions


def save_to_json(questions: List[Dict], filename: str = 'questions.json'):
    """Save questions to a JSON file."""
    try:
        with open(filename, 'w', encoding='utf-8') as f:
            json.dump(questions, f, indent=2, ensure_ascii=False)
        logger.info(f"Saved {len(questions)} questions to {filename}")
    except Exception as e:
        logger.error(f"Error saving to JSON: {e}")


def load_from_json(filename: str = 'questions.json') -> List[Dict]:
    """Load questions from a JSON file."""
    try:
        with open(filename, 'r', encoding='utf-8') as f:
            questions = json.load(f)
        logger.info(f"Loaded {len(questions)} questions from {filename}")
        return questions
    except FileNotFoundError:
        logger.warning(f"{filename} not found")
        return []
    except Exception as e:
        logger.error(f"Error loading from JSON: {e}")
        return []


def generate_sample_questions() -> List[Dict]:
    """
    Generate sample DBMS questions as fallback.
    Used when scraping fails or for testing.
    """
    sample_questions = [
        {
            "question": "What does SQL stand for?",
            "options": {
                "a": "Structured Query Language",
                "b": "Simple Query Language",
                "c": "Standard Query Language",
                "d": "Sequential Query Language"
            },
            "answer": "a",
            "explanation": "SQL stands for Structured Query Language. It is used for managing and manipulating relational databases.",
            "category": "SQL Basics"
        },
        {
            "question": "Which SQL command is used to retrieve data from a database?",
            "options": {
                "a": "GET",
                "b": "SELECT",
                "c": "RETRIEVE",
                "d": "FETCH"
            },
            "answer": "b",
            "explanation": "SELECT is the SQL command used to retrieve data from one or more tables in a database.",
            "category": "SQL Basics"
        },
        {
            "question": "What is a primary key?",
            "options": {
                "a": "A key that can have NULL values",
                "b": "A key that uniquely identifies each record in a table",
                "c": "A key that references another table",
                "d": "A key used for encryption"
            },
            "answer": "b",
            "explanation": "A primary key is a column or set of columns that uniquely identifies each row in a table. It cannot contain NULL values.",
            "category": "Keys"
        },
        {
            "question": "Which normal form eliminates transitive dependencies?",
            "options": {
                "a": "First Normal Form (1NF)",
                "b": "Second Normal Form (2NF)",
                "c": "Third Normal Form (3NF)",
                "d": "Boyce-Codd Normal Form (BCNF)"
            },
            "answer": "c",
            "explanation": "Third Normal Form (3NF) eliminates transitive dependencies, where non-key attributes depend on other non-key attributes.",
            "category": "Normalization"
        },
        {
            "question": "What is a foreign key?",
            "options": {
                "a": "A key from a foreign database",
                "b": "A key that references the primary key of another table",
                "c": "A key used for international databases",
                "d": "A key that must be unique"
            },
            "answer": "b",
            "explanation": "A foreign key is a column that creates a relationship between two tables by referencing the primary key of another table.",
            "category": "Keys"
        },
        {
            "question": "Which SQL clause is used to filter records?",
            "options": {
                "a": "FILTER",
                "b": "WHERE",
                "c": "HAVING",
                "d": "LIMIT"
            },
            "answer": "b",
            "explanation": "The WHERE clause is used to filter records based on specified conditions. HAVING is used for filtering groups after GROUP BY.",
            "category": "SQL Queries"
        },
        {
            "question": "What does ACID stand for in database transactions?",
            "options": {
                "a": "Atomicity, Consistency, Isolation, Durability",
                "b": "Atomicity, Concurrency, Isolation, Durability",
                "c": "Availability, Consistency, Isolation, Durability",
                "d": "Atomicity, Consistency, Integration, Durability"
            },
            "answer": "a",
            "explanation": "ACID stands for Atomicity (all or nothing), Consistency (valid state), Isolation (concurrent transactions), and Durability (permanent changes).",
            "category": "Transactions"
        },
        {
            "question": "Which type of join returns all records from both tables?",
            "options": {
                "a": "INNER JOIN",
                "b": "LEFT JOIN",
                "c": "RIGHT JOIN",
                "d": "FULL OUTER JOIN"
            },
            "answer": "d",
            "explanation": "FULL OUTER JOIN returns all records from both tables, with NULL values where there is no match.",
            "category": "Join Expressions"
        },
        {
            "question": "What is a view in SQL?",
            "options": {
                "a": "A physical table",
                "b": "A virtual table based on a SELECT query",
                "c": "A type of index",
                "d": "A backup of a table"
            },
            "answer": "b",
            "explanation": "A view is a virtual table that is based on the result set of a SELECT statement. It does not store data itself.",
            "category": "Views"
        },
        {
            "question": "Which aggregate function returns the number of rows?",
            "options": {
                "a": "SUM()",
                "b": "AVG()",
                "c": "COUNT()",
                "d": "MAX()"
            },
            "answer": "c",
            "explanation": "COUNT() returns the number of rows that match the specified criteria.",
            "category": "Aggregate Functions"
        },
        {
            "question": "What is normalization in DBMS?",
            "options": {
                "a": "Process of adding redundancy",
                "b": "Process of organizing data to reduce redundancy",
                "c": "Process of encrypting data",
                "d": "Process of backing up data"
            },
            "answer": "b",
            "explanation": "Normalization is the process of organizing data in a database to reduce redundancy and improve data integrity.",
            "category": "Normalization"
        },
        {
            "question": "Which SQL statement is used to update data in a table?",
            "options": {
                "a": "MODIFY",
                "b": "CHANGE",
                "c": "UPDATE",
                "d": "ALTER"
            },
            "answer": "c",
            "explanation": "The UPDATE statement is used to modify existing records in a table. ALTER is used to modify the table structure.",
            "category": "SQL Queries"
        },
        {
            "question": "What is a deadlock in DBMS?",
            "options": {
                "a": "A fast transaction",
                "b": "A situation where two transactions wait indefinitely for each other",
                "c": "A type of index",
                "d": "A backup failure"
            },
            "answer": "b",
            "explanation": "A deadlock occurs when two or more transactions are waiting for each other to release locks, creating a cycle of dependencies.",
            "category": "Transactions"
        },
        {
            "question": "Which constraint ensures that a column cannot have NULL values?",
            "options": {
                "a": "UNIQUE",
                "b": "PRIMARY KEY",
                "c": "NOT NULL",
                "d": "CHECK"
            },
            "answer": "c",
            "explanation": "The NOT NULL constraint ensures that a column cannot contain NULL values. Every row must have a value for that column.",
            "category": "Constraints"
        },
        {
            "question": "What is the purpose of the GROUP BY clause?",
            "options": {
                "a": "To sort results",
                "b": "To group rows that have the same values",
                "c": "To filter records",
                "d": "To join tables"
            },
            "answer": "b",
            "explanation": "GROUP BY groups rows that have the same values in specified columns, often used with aggregate functions like COUNT, SUM, AVG.",
            "category": "SQL Queries"
        },
        {
            "question": "What is an entity in ER model?",
            "options": {
                "a": "A relationship between tables",
                "b": "A real-world object with attributes",
                "c": "A type of query",
                "d": "A database index"
            },
            "answer": "b",
            "explanation": "An entity represents a real-world object or concept that can be distinctly identified, such as a student, employee, or product.",
            "category": "ER Model"
        },
        {
            "question": "Which SQL command is used to remove a table from database?",
            "options": {
                "a": "DELETE",
                "b": "REMOVE",
                "c": "DROP",
                "d": "TRUNCATE"
            },
            "answer": "c",
            "explanation": "DROP TABLE removes a table and all its data from the database. DELETE removes rows, TRUNCATE removes all rows but keeps the structure.",
            "category": "SQL Basics"
        },
        {
            "question": "What is a candidate key?",
            "options": {
                "a": "Any column in a table",
                "b": "A minimal superkey that can uniquely identify a tuple",
                "c": "A foreign key reference",
                "d": "A key waiting to be selected"
            },
            "answer": "b",
            "explanation": "A candidate key is a minimal set of attributes that can uniquely identify a tuple. A table can have multiple candidate keys.",
            "category": "Keys"
        },
        {
            "question": "What is the difference between DELETE and TRUNCATE?",
            "options": {
                "a": "No difference",
                "b": "DELETE can have WHERE clause, TRUNCATE cannot",
                "c": "TRUNCATE is faster but DELETE can be rolled back",
                "d": "Both B and C"
            },
            "answer": "d",
            "explanation": "DELETE removes specific rows and can be rolled back, while TRUNCATE removes all rows quickly but cannot be easily rolled back.",
            "category": "SQL Basics"
        },
        {
            "question": "What is referential integrity?",
            "options": {
                "a": "Data encryption",
                "b": "Ensuring foreign key values match primary key values",
                "c": "Table backup",
                "d": "Query optimization"
            },
            "answer": "b",
            "explanation": "Referential integrity ensures that relationships between tables remain consistent - a foreign key must reference an existing primary key.",
            "category": "Integrity Constraints"
        },
        {
            "question": "Which isolation level provides the highest level of isolation?",
            "options": {
                "a": "Read Uncommitted",
                "b": "Read Committed",
                "c": "Repeatable Read",
                "d": "Serializable"
            },
            "answer": "d",
            "explanation": "Serializable provides the highest isolation level, ensuring transactions appear to execute sequentially, preventing all anomalies.",
            "category": "Transactions"
        },
        {
            "question": "What is a subquery?",
            "options": {
                "a": "A query that runs faster",
                "b": "A query nested inside another query",
                "c": "A query on a small table",
                "d": "A query with fewer columns"
            },
            "answer": "b",
            "explanation": "A subquery (nested query) is a query within another SQL query, often used in WHERE, FROM, or SELECT clauses.",
            "category": "Nested Subqueries"
        },
        {
            "question": "What does DDL stand for?",
            "options": {
                "a": "Data Definition Language",
                "b": "Data Description Language",
                "c": "Database Definition Language",
                "d": "Data Design Language"
            },
            "answer": "a",
            "explanation": "DDL stands for Data Definition Language, which includes commands like CREATE, ALTER, DROP for defining database structure.",
            "category": "SQL Basics"
        },
        {
            "question": "What is the purpose of an index in a database?",
            "options": {
                "a": "To store data",
                "b": "To speed up data retrieval",
                "c": "To encrypt data",
                "d": "To backup data"
            },
            "answer": "b",
            "explanation": "An index is a data structure that improves the speed of data retrieval operations on a database table at the cost of additional storage.",
            "category": "SQL Basics"
        },
        {
            "question": "What is 2NF?",
            "options": {
                "a": "A table with no repeating groups",
                "b": "A table in 1NF with no partial dependencies",
                "c": "A table with no transitive dependencies",
                "d": "A table with no multi-valued dependencies"
            },
            "answer": "b",
            "explanation": "Second Normal Form (2NF) requires the table to be in 1NF and have no partial dependencies (non-key attributes depend on the full key).",
            "category": "Normalization"
        },
        {
            "question": "What is a weak entity?",
            "options": {
                "a": "An entity with low importance",
                "b": "An entity that cannot be uniquely identified by its own attributes",
                "c": "An entity with few attributes",
                "d": "An entity from a small table"
            },
            "answer": "b",
            "explanation": "A weak entity cannot be uniquely identified by its own attributes alone and depends on a strong (owner) entity for identification.",
            "category": "Weak Entity Sets"
        },
        {
            "question": "What is the HAVING clause used for?",
            "options": {
                "a": "Filtering rows before grouping",
                "b": "Filtering groups after GROUP BY",
                "c": "Joining tables",
                "d": "Sorting results"
            },
            "answer": "b",
            "explanation": "HAVING filters groups after GROUP BY, while WHERE filters individual rows before grouping. HAVING is used with aggregate functions.",
            "category": "SQL Queries"
        },
        {
            "question": "What is data redundancy?",
            "options": {
                "a": "Data encryption",
                "b": "Unnecessary repetition of data",
                "c": "Data backup",
                "d": "Data compression"
            },
            "answer": "b",
            "explanation": "Data redundancy refers to the unnecessary repetition of data in a database, which can lead to inconsistencies and wasted storage.",
            "category": "Normalization"
        },
        {
            "question": "What is a tuple in DBMS?",
            "options": {
                "a": "A column in a table",
                "b": "A row in a table",
                "c": "A table itself",
                "d": "A database"
            },
            "answer": "b",
            "explanation": "A tuple (or record) is a single row in a relational table, representing a single data item with values for each attribute.",
            "category": "SQL Basics"
        },
        {
            "question": "What is BCNF?",
            "options": {
                "a": "Basic Common Normal Form",
                "b": "Boyce-Codd Normal Form",
                "c": "Binary Code Normal Form",
                "d": "Best Case Normal Form"
            },
            "answer": "b",
            "explanation": "BCNF (Boyce-Codd Normal Form) is a stricter version of 3NF where every determinant must be a candidate key.",
            "category": "BCNF"
        }
    ]
    
    return sample_questions


def run_scraper(use_sample_fallback: bool = True) -> List[Dict]:
    """
    Main function to run the scraper.
    
    Args:
        use_sample_fallback: If True, use sample questions if scraping fails or yields few results
    
    Returns:
        List of questions
    """
    logger.info("Starting DBMS Quiz Scraper...")
    
    # Try to scrape from web
    questions = scrape_all_pages()
    
    # If scraping failed or returned too few questions, use sample data
    if len(questions) < 10 and use_sample_fallback:
        logger.warning("Scraping yielded few results, using sample questions as fallback")
        sample = generate_sample_questions()
        questions.extend(sample)
    
    # Save to JSON for caching
    if questions:
        save_to_json(questions)
    
    return questions


if __name__ == "__main__":
    questions = run_scraper()
    print(f"\nTotal questions available: {len(questions)}")
    
    if questions:
        print("\nSample question:")
        sample = questions[0]
        print(f"Q: {sample['question']}")
        for opt, text in sample['options'].items():
            print(f"   {opt}) {text}")
        print(f"Answer: {sample['answer']}")
        print(f"Explanation: {sample['explanation']}")
