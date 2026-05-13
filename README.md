# scraped-cli

> Intelligent web data aggregation CLI — scrape websites, search for people & places, and get structured JSON output.

[![npm version](https://img.shields.io/npm/v/scraped-cli.svg)](https://www.npmjs.com/package/scraped-cli)
[![license](https://img.shields.io/npm/l/scraped-cli.svg)](./LICENSE)

---

## Installation

```bash
npm install -g scraped-cli
```

---

## Commands

### 1. `search` — Aggregate people or places data

Searches the web and aggregates structured data from multiple sources (GitHub, Wikipedia, public profile pages).

```bash
scraped search "<query>"
scraped search "<query>" --type people
scraped search "<query>" --type places
scraped search "<query>" --type people --out results.json
```

**Options**

| Flag | Description | Default |
|------|-------------|---------|
| `--type <type>` | `people`, `places`, or `auto` | `auto` |
| `--out <file>` | Save output to a JSON file | stdout |

**Examples**

```bash
scraped search "Anointed"
scraped search "Anointed" --type people
scraped search "Lagos Island" --type places
scraped search "Anointed" --type people --out anointed.json
```

**Output format**

```json
{
  "query": "Anointed",
  "type": "people",
  "results": [
    {
      "name": "Anointed Agunloye",
      "usernames": ["anointedthedeveloper"],
      "bio": "If it compiles, ship it.",
      "location": "Nigeria",
      "socials": {
        "github": "https://github.com/anointedthedeveloper",
        "website": "https://anobyte.online"
      },
      "images": ["https://avatars.githubusercontent.com/u/235742077?v=4"],
      "confidence": 0.63,
      "possibleMatch": false
    }
  ]
}
```

---

### 2. `investigate` — Deep intelligence report

Performs a deep multi-source investigation and generates a full structured report.

```bash
scraped investigate "<name>"
scraped investigate "<name>" --deep
scraped investigate "<name>" --out report.json
```

**Options**

| Flag | Description | Default |
|------|-------------|---------|
| `--deep` | Enable deep search across all sources | `false` |
| `--out <file>` | Save report to file | `intelligence-report.json` |
| `--format <format>` | Output format: `json` or `text` | `json` |

**Examples**

```bash
scraped investigate "Anointed Agunloye"
scraped investigate "Anointed Agunloye" --deep --out report.json
```

---

### 3. Direct URL scraping

Scrape any URL directly using CSS selectors.

```bash
scraped <url> --selector "<css-selector>"
scraped <url> --map field1:selector1 field2:selector2
```

**Options**

| Flag | Description | Default |
|------|-------------|---------|
| `-s, --selector <selector>` | CSS selector to extract text | — |
| `-m, --map <fields...>` | Map field names to selectors | — |
| `-o, --out <file>` | Save output to JSON file | stdout |
| `-t, --timeout <ms>` | Request timeout in ms | `10000` |
| `-H, --headers <json>` | Custom headers as JSON string | — |
| `-a, --attribute <attr>` | Extract attribute instead of text | `text` |

**Examples**

```bash
# Extract h1 text
scraped https://example.com -s "h1"

# Extract image src attributes
scraped https://example.com -s "img@src"

# Extract multiple fields
scraped https://example.com --map title:h1 price:.price description:.summary

# Save to file
scraped https://example.com --map title:h1 price:.price --out result.json

# With custom headers and timeout
scraped https://example.com -s "h1" --timeout 5000 --headers '{"Authorization":"Bearer token"}'
```

**Selector@attribute syntax**

Append `@attr` to any selector to extract a specific attribute:

```bash
scraped https://example.com -s "a@href"       # extract href
scraped https://example.com -s "img@src"      # extract src
scraped https://example.com -s "div@data-id"  # extract data attribute
```

---

### 4. `batch` — Process multiple queries from a file

```bash
scraped batch queries.txt
scraped batch queries.txt --type investigate --outdir ./reports
```

**Options**

| Flag | Description | Default |
|------|-------------|---------|
| `--outdir <dir>` | Output directory for results | `./reports` |
| `--type <type>` | `search` or `investigate` | `search` |

**queries.txt format**
```
Anointed Agunloye
Lagos Island
Elon Musk
# lines starting with # are ignored
```

---

## Confidence Scores

Every `search` result includes a `confidence` score between `0.0` and `1.0`:

| Score | Meaning |
|-------|---------|
| `0.8+` | Strong match — multiple sources, rich data |
| `0.5–0.8` | Moderate match — some fields missing |
| `< 0.5` | Weak match — limited public data found |

---

## Entity Matching

When multiple results look like the same person (similar name, shared usernames, overlapping social links), they are automatically merged and flagged:

```json
{
  "possibleMatch": true,
  "confidence": 0.78
}
```

---

## License

[MIT](./LICENSE) © [anointedthedeveloper](https://github.com/anointedthedeveloper)
