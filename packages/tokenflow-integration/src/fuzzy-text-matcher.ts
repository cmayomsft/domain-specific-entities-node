import { Alias, levenshtein, Lexicon, Token, Tokenizer } from "token-flow";

export interface FuzzyItemDefinition<TMatch> {
    pattern: string;
    match: TMatch;
}

export interface FuzzyMatchResult<TMatch> {
    match: TMatch;
    score: number;
}

export class FuzzyTextMatcher<TMatch> {
    private readonly lexicon: Lexicon;
    private readonly tokenizer: Tokenizer;

    constructor(items: IterableIterator<FuzzyItemDefinition<TMatch>>, debugMode: boolean = false) {
        this.lexicon = new Lexicon();

        this.tokenizer = new Tokenizer(
            this.lexicon.termModel,
            this.lexicon.numberParser,
            debugMode,
        );

        this.lexicon.addDomain(mapItemsToAliases<TMatch>(items));
        this.lexicon.ingest(this.tokenizer);
    }

    public matches(query: string): Array<FuzzyMatchResult<TMatch>> {
        const terms = query.split(/\s+/);
        const stemmed = terms.map(this.lexicon.termModel.stem);
        const hashed = stemmed.map(this.lexicon.termModel.hashTerm);

        // TODO: terms should be stemmed and hashed by TermModel in Lexicon.
        const graph = this.tokenizer.generateGraph(hashed, stemmed);
        const path = graph.findPath([], 0);

        const matches: Array<FuzzyMatchResult<TMatch>> = [];
        for (const edge of path.values()) {
            const token = this.tokenizer.tokenFromEdge(edge);
            if (isFuzzyMatchToken<TMatch>(token)) {
                matches.push({ match: token.match, score: edge.score });
            }
        }

        // TODO: check sort order
        return matches.sort( (a, b) => b.score - a.score);
    }
}

const FUZZY: unique symbol = Symbol("FUZZY");
type FUZZY = typeof FUZZY;

interface FuzzyMatchToken<TFuzzyMatch> extends Token {
    type: FUZZY;
    match: TFuzzyMatch;
}

function isFuzzyMatchToken<TEntity>(token: Token): token is FuzzyMatchToken<TEntity> {
    return token.type === FUZZY;
}

function* mapItemsToAliases<TEntity>(fuzzyItems: IterableIterator<FuzzyItemDefinition<TEntity>>): IterableIterator<Alias> {
    for (const item of fuzzyItems) {
        yield {
            text: item.pattern,
            token: { type: FUZZY, match: item.match } as FuzzyMatchToken<TEntity>,
            matcher: levenshtein,
        };
    }
}
