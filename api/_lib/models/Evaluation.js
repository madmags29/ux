import mongoose from 'mongoose';

const EvaluationSchema = new mongoose.Schema(
  {
    id: { type: String, required: true, unique: true },
    userId: { type: String, default: null, index: true },
    timestamp: { type: String, required: true },
    targetUrl: { type: String, default: '' },
    mode: { type: String, default: 'url' },
    screenCount: { type: Number, default: 0 },
    overallScore: { type: Number, default: 0 },
    finalVerdict: { type: String, default: 'Good' },
    productName: { type: String, default: 'Evaluated Product' },
    productCategory: { type: String, default: 'General Web App' },
    screens: { type: Array, default: [] },
    aggregate: { type: Object, default: {} },
  },
  {
    timestamps: true,
  }
);

export default mongoose.models.Evaluation || mongoose.model('Evaluation', EvaluationSchema);
