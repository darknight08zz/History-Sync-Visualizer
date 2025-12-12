
export const getSmartSuggestions = (): string[] => {
    const hour = new Date().getHours();
    const day = new Date().getDay(); // 0 = Sun, 1 = Mon...

    const suggestions = [
        "Show my recent high-impact work",
        "Summarize my week so far"
    ];

    // Time-based
    if (hour < 10) {
        suggestions.push("What's on my plate for today?");
        suggestions.push("Review yesterday's achievements");
    } else if (hour > 16) {
        suggestions.push("Summarize my work today");
        suggestions.push("What did I miss?");
    }

    // Day-based
    if (day === 1) { // Monday
        suggestions.unshift("Plan my week based on last week's unfinished tasks");
    } else if (day === 5) { // Friday
        suggestions.unshift("Draft my weekly status report");
    }

    // Interaction based (mocked for now, could use real data)
    suggestions.push("Who are my top collaborators?");
    suggestions.push("What is my most productive time of day?");

    // Return top 4 random-ish but relevant
    return suggestions.slice(0, 4);
};
