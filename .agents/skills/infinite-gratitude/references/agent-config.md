# Agent Configuration Reference

## Default Agent Setup

```python
Task(
    prompt="Research {direction} for {topic}. Find:
    1. Top 3-5 recommendations
    2. Pros and cons
    3. Use cases
    4. Key insights

    Output: Markdown",
    subagent_type="research-scout",
    model="haiku",
    run_in_background=True
)
```

## Research Directions

| Direction | Focus | Tools Used |
|-----------|-------|------------|
| GitHub | Repos, stars, activity | gh, WebSearch |
| HuggingFace | Models, datasets | WebSearch, WebFetch |
| Papers | Academic research | WebSearch |
| Competitors | Market analysis | WebSearch |
| Best Practices | Tutorials, guides | WebSearch |

## Depth Levels

### Quick
- 3 agents
- 1 wave only
- No follow-up

### Normal (Default)
- 5 agents
- Up to 3 waves
- Ask for follow-up

### Deep
- 10 agents
- Unlimited waves
- Automatic follow-up

## Cost Estimation

| Depth | Agents | Est. Tokens | Est. Cost |
|-------|--------|-------------|-----------|
| quick | 3 | ~15K | ~$0.02 |
| normal | 5 | ~50K | ~$0.05 |
| deep | 10 | ~200K | ~$0.20 |

*Using haiku model for cost efficiency*

## Output Format

```markdown
# {topic} Report

## 📊 Overview
- Time: {timestamp}
- Agents: {count}
- Depth: {depth}

## 🔍 Findings

### 1. GitHub
[Agent 1 findings]

### 2. HuggingFace
[Agent 2 findings]

### 3. Papers
[Agent 3 findings]

### 4. Competitors
[Agent 4 findings]

### 5. Best Practices
[Agent 5 findings]

## 💡 Key Insights
[Synthesized insights]

## 🔄 Follow-up Questions
[New questions discovered]
```
