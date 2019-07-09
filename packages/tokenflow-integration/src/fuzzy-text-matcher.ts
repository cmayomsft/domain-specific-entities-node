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

    constructor(items: IterableIterator<FuzzyItemDefinition<TMatch>>, public readonly minScoreThreshold: number = 0, debugMode: boolean = false) {
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

        const graph = this.tokenizer.generateGraph(hashed, stemmed);

        const distinctMatches = new Map<TMatch, FuzzyMatchResult<TMatch>>();

        for (const edges of graph.edgeLists) {
            for (const edge of edges) {
                // If this edge is below the min-score threshold, just skip it
                if (edge.score < this.minScoreThreshold) {
                    continue;
                }

                const token = this.tokenizer.tokenFromEdge(edge);

                if (isFuzzyMatchToken<TMatch>(token)) {
                    const match = token.match;
                    const existingMatch = distinctMatches.get(match);

                    // If there isn't already an existing match or this match has a higher score than the existing one, add it
                    if (existingMatch === undefined
                            ||
                        edge.score > existingMatch.score) {
                        distinctMatches.set(match, { match, score: edge.score });
                    }
                }
            }
        }

        // Sort the matches by score (highest to lowest)
        const filteredAndSortedMatches = Array.from(distinctMatches.values())
            .sort((lhe, rhe) => rhe.score - lhe.score);

        return filteredAndSortedMatches;
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
