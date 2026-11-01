pub struct TokenStats {
    pub character_count: usize,
    pub estimated_tokens: usize,
    pub line_count: usize,
}

pub fn estimate_bpe_tokens(input: &str) -> TokenStats {
    let character_count = input.chars().count();
    let line_count = input.lines().count().max(1);
    let estimated_tokens = (character_count + 3) / 4;

    TokenStats {
        character_count,
        estimated_tokens,
        line_count,
    }
}
