
import mongoose, { Schema, model, models } from 'mongoose';

const EventSchema = new Schema({
    id: { type: String, required: true, unique: true }, // Keep UUID from client/ingest
    timestamp: { type: Date, required: true, index: true }, // Date object for efficient queries
    source: { type: String, required: true, index: true },
    actor: { type: String, index: true },
    type: { type: String },
    tags: { type: [String], default: [] },
    content_snippet: { type: String },
    analysis: {
        impact_score: { type: Number }, // 1-10
        impact_label: { type: String }, // "High", "Medium", "Low"
        sentiment: { type: String },    // "Positive", "Neutral", "Frustrated"
        summary: { type: String }       // One-liner
    }
}, {
    timestamps: true // adds createdAt, updatedAt
});

// Index for aggregation queries
EventSchema.index({ timestamp: -1 });

// Prevent recompilation of model in dev mode
const Event = models.Event || model('Event', EventSchema);

export default Event;
