import { CodeElement, SearchQuery, SearchResult, SearchOptions, ElementType } from '../types';

export class SearchEngine {
  private elements: CodeElement[] = [];

  constructor(elements: CodeElement[] = []) {
    this.elements = elements;
  }

  public updateElements(elements: CodeElement[]): void {
    this.elements = elements;
  }

  public search(query: SearchQuery, options: SearchOptions = {}): SearchResult[] {
    const {
      maxResults = 50,
      threshold = 0.1,
      includeSnippets = true,
      caseSensitive = false,
      languages = [],
      filePatterns = []
    } = options;

    let filteredElements = this.elements;

    if (query.elementTypes.length > 0) {
      filteredElements = filteredElements.filter(element =>
        query.elementTypes.includes(element.type)
      );
    }

    if (languages.length > 0) {
      filteredElements = filteredElements.filter(element =>
        languages.some(lang => element.filePath.endsWith(`.${lang}`))
      );
    }

    if (filePatterns.length > 0) {
      filteredElements = filteredElements.filter(element =>
        filePatterns.some(pattern => this.matchesPattern(element.filePath, pattern))
      );
    }

    const results: SearchResult[] = [];

    for (const element of filteredElements) {
      const score = this.calculateScore(element, query, caseSensitive);
      
      if (score >= threshold) {
        const snippet = includeSnippets ? this.generateSnippet(element) : '';
        const matchedKeywords = this.getMatchedKeywords(element, query.keywords, caseSensitive);
        const relevanceReason = this.getRelevanceReason(element, query, matchedKeywords);

        results.push({
          element,
          score,
          snippet,
          matchedKeywords,
          relevanceReason
        });
      }
    }

    return results
      .sort((a, b) => b.score - a.score)
      .slice(0, maxResults);
  }

  private calculateScore(element: CodeElement, query: SearchQuery, caseSensitive: boolean): number {
    let score = 0;
    const normalize = (text: string) => caseSensitive ? text : text.toLowerCase();

    const elementName = normalize(element.name);
    const elementDescription = normalize(element.description || '');
    const elementContext = normalize(element.context || '');
    const elementSignature = normalize(element.signature || '');

    for (const keyword of query.keywords) {
      const normalizedKeyword = normalize(keyword);
      
      if (elementName.includes(normalizedKeyword)) {
        score += this.getNameMatchScore(elementName, normalizedKeyword);
      }
      
      if (elementDescription.includes(normalizedKeyword)) {
        score += 0.3;
      }
      
      if (elementSignature.includes(normalizedKeyword)) {
        score += 0.4;
      }
      
      if (elementContext.includes(normalizedKeyword)) {
        score += 0.1;
      }

      if (element.parameters) {
        for (const param of element.parameters) {
          if (normalize(param.name).includes(normalizedKeyword)) {
            score += 0.2;
          }
          if (param.type && normalize(param.type).includes(normalizedKeyword)) {
            score += 0.15;
          }
        }
      }
    }

    score += this.getTypeMatchScore(element.type, query.elementTypes);
    score += this.getSemanticScore(element, query);

    return Math.min(score, 1.0);
  }

  private getNameMatchScore(elementName: string, keyword: string): number {
    if (elementName === keyword) {return 1.0;}
    if (elementName.startsWith(keyword)) {return 0.8;}
    if (elementName.endsWith(keyword)) {return 0.6;}
    if (elementName.includes(keyword)) {return 0.4;}
    return 0;
  }

  private getTypeMatchScore(elementType: ElementType, queryTypes: ElementType[]): number {
    if (queryTypes.includes(elementType)) {
      return 0.2;
    }
    return 0;
  }

  private getSemanticScore(element: CodeElement, query: SearchQuery): number {
    let score = 0;
    
    const actionKeywords = [
      'handle', 'process', 'manage', 'deal', 'send', 'receive',
      'create', 'delete', 'update', 'get', 'set', 'validate',
      'authenticate', 'authorize', 'connect', 'parse', 'format',
      'calculate', 'compute', 'render', 'display', 'show'
    ];

    const domainKeywords = [
      'database', 'auth', 'user', 'email', 'file', 'api',
      'validation', 'error', 'config', 'log', 'test', 'service'
    ];

    for (const keyword of query.keywords) {
      if (actionKeywords.includes(keyword)) {
        if (element.name.toLowerCase().includes(keyword)) {
          score += 0.3;
        }
      }
      
      if (domainKeywords.includes(keyword)) {
        if (element.name.toLowerCase().includes(keyword) ||
            element.description?.toLowerCase().includes(keyword)) {
          score += 0.2;
        }
      }
    }

    if (element.type === ElementType.FUNCTION || element.type === ElementType.METHOD) {
      if (query.keywords.some(k => element.name.toLowerCase().includes(k))) {
        score += 0.1;
      }
    }

    return score;
  }

  private getMatchedKeywords(element: CodeElement, keywords: string[], caseSensitive: boolean): string[] {
    const normalize = (text: string) => caseSensitive ? text : text.toLowerCase();
    const matchedKeywords: string[] = [];

    const searchableText = [
      element.name,
      element.description || '',
      element.signature || '',
      element.context || '',
      ...(element.parameters?.map(p => p.name) || [])
    ].join(' ');

    const normalizedSearchable = normalize(searchableText);

    for (const keyword of keywords) {
      if (normalizedSearchable.includes(normalize(keyword))) {
        matchedKeywords.push(keyword);
      }
    }

    return matchedKeywords;
  }

  private getRelevanceReason(element: CodeElement, query: SearchQuery, matchedKeywords: string[]): string {
    const reasons: string[] = [];

    if (matchedKeywords.length > 0) {
      reasons.push(`Matches keywords: ${matchedKeywords.join(', ')}`);
    }

    if (query.elementTypes.includes(element.type)) {
      reasons.push(`Matches requested type: ${element.type}`);
    }

    if (element.name.toLowerCase().includes(query.text.toLowerCase())) {
      reasons.push('Name contains query text');
    }

    if (element.description && element.description.toLowerCase().includes(query.text.toLowerCase())) {
      reasons.push('Description contains query text');
    }

    return reasons.join('; ') || 'General relevance match';
  }

  private generateSnippet(element: CodeElement): string {
    const lines: string[] = [];
    
    if (element.description) {
      lines.push(`// ${element.description}`);
    }

    switch (element.type) {
      case ElementType.FUNCTION:
        lines.push(element.signature || `function ${element.name}()`);
        break;
      case ElementType.CLASS:
        lines.push(`class ${element.name}`);
        break;
      case ElementType.METHOD:
        lines.push(element.signature || `${element.name}()`);
        break;
      case ElementType.PROPERTY:
        lines.push(`${element.name}: ${element.returnType || 'any'}`);
        break;
      case ElementType.VARIABLE:
        lines.push(`${element.name}: ${element.returnType || 'any'}`);
        break;
      case ElementType.INTERFACE:
        lines.push(`interface ${element.name}`);
        break;
      case ElementType.TYPE:
        lines.push(`type ${element.name}`);
        break;
      case ElementType.ENUM:
        lines.push(`enum ${element.name}`);
        break;
      default:
        lines.push(element.name);
    }

    return lines.join('\n');
  }

  private matchesPattern(filePath: string, pattern: string): boolean {
    const regexPattern = pattern
      .replace(/\./g, '\\.')
      .replace(/\*/g, '.*')
      .replace(/\?/g, '.');
    
    const regex = new RegExp(`^${regexPattern}$`);
    return regex.test(filePath);
  }

  public getStatistics(): {
    totalElements: number;
    elementsByType: Record<ElementType, number>;
    fileCount: number;
  } {
    const elementsByType = {} as Record<ElementType, number>;
    const files = new Set<string>();

    for (const element of this.elements) {
      elementsByType[element.type] = (elementsByType[element.type] || 0) + 1;
      files.add(element.filePath);
    }

    return {
      totalElements: this.elements.length,
      elementsByType,
      fileCount: files.size
    };
  }
}