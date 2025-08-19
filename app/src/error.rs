use std::error::Error;
use std::fmt::Display;

#[derive(Debug, Clone)]
pub struct SyntaxError {
    message: String,
    pub line: Option<usize>,
}

impl SyntaxError {
    pub fn new(message: String, line: Option<usize>) -> Self {
        SyntaxError { message, line }
    }

    pub fn with_line(self, line: usize) -> Self {
        SyntaxError {
            message: self.message,
            line: Some(line),
        }
    }
}

impl Display for SyntaxError {
    fn fmt(&self, f: &mut std::fmt::Formatter<'_>) -> std::fmt::Result {
        if let Some(line) = self.line {
            write!(f, "Syntax error on line {}: {}", line, self.message)
        } else {
            write!(f, "Syntax error: {}", self.message)
        }
    }
}

impl Error for SyntaxError {}
