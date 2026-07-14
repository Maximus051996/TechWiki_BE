import { mongoose } from './connection.js';
import { STATUS_VALUES, Status } from '../../../domain/value-objects/Status.js';

const { Schema, model } = mongoose;

const baseOpts = { timestamps: true, versionKey: false };

/* ----------------------------- User (Admin) ----------------------------- */
const userSchema = new Schema(
    {
        name: { type: String, required: true, trim: true },
        email: { type: String, required: true, unique: true, lowercase: true, trim: true, index: true },
        passwordHash: { type: String, required: true },
        role: { type: String, default: 'admin' },
    },
    baseOpts
);

/* ------------------------------- Module -------------------------------- */
const moduleSchema = new Schema(
    {
        name: { type: String, required: true, trim: true },
        slug: { type: String, required: true, unique: true, index: true },
        description: { type: String, default: '' },
        icon: { type: String, default: '' },
        displayOrder: { type: Number, default: 0, index: true },
        status: { type: String, enum: STATUS_VALUES, default: Status.DRAFT, index: true },
    },
    baseOpts
);
moduleSchema.index({ name: 'text', description: 'text' });
// Case-insensitive unique name.
moduleSchema.index({ name: 1 }, { unique: true, collation: { locale: 'en', strength: 2 } });

/* ------------------------------ Category ------------------------------- */
const categorySchema = new Schema(
    {
        moduleId: { type: Schema.Types.ObjectId, ref: 'Module', required: true, index: true },
        name: { type: String, required: true, trim: true },
        slug: { type: String, required: true, unique: true, index: true },
        description: { type: String, default: '' },
        displayOrder: { type: Number, default: 0, index: true },
        status: { type: String, enum: STATUS_VALUES, default: Status.DRAFT, index: true },
    },
    baseOpts
);
categorySchema.index({ name: 'text', description: 'text' });
// Unique category name within a module (case-insensitive).
categorySchema.index(
    { moduleId: 1, name: 1 },
    { unique: true, collation: { locale: 'en', strength: 2 } }
);

/* ------------------------------- Article ------------------------------- */
const articleSchema = new Schema(
    {
        title: { type: String, required: true, trim: true },
        slug: { type: String, required: true, unique: true, index: true },
        moduleId: { type: Schema.Types.ObjectId, ref: 'Module', required: true, index: true },
        categoryId: { type: Schema.Types.ObjectId, ref: 'Category', required: true, index: true },
        shortDescription: { type: String, default: '' },
        content: { type: String, required: true },
        thumbnail: { type: String, default: '' },
        bannerImage: { type: String, default: '' },
        tags: { type: [String], default: [], index: true },
        status: { type: String, enum: STATUS_VALUES, default: Status.DRAFT, index: true },
        seoTitle: { type: String, default: '' },
        seoDescription: { type: String, default: '' },
        featured: { type: Boolean, default: false, index: true },
        readingTime: { type: Number, default: 0 },
        views: { type: Number, default: 0, index: true },
        publishedDate: { type: Date, default: null, index: true },
    },
    baseOpts
);
articleSchema.index({ title: 'text', shortDescription: 'text', tags: 'text' });
// Common customer query path: published articles in a category, newest first.
articleSchema.index({ status: 1, categoryId: 1, publishedDate: -1 });
articleSchema.index({ status: 1, featured: 1, publishedDate: -1 });

/* -------------------------------- Video -------------------------------- */
const videoSchema = new Schema(
    {
        title: { type: String, required: true, trim: true },
        moduleId: { type: Schema.Types.ObjectId, ref: 'Module', required: true, index: true },
        categoryId: { type: Schema.Types.ObjectId, ref: 'Category', required: true, index: true },
        videoUrl: { type: String, required: true },
        youtubeId: { type: String, default: '' },
        thumbnail: { type: String, default: '' },
        description: { type: String, default: '' },
        duration: { type: String, default: '' },
        tags: { type: [String], default: [], index: true },
        status: { type: String, enum: STATUS_VALUES, default: Status.DRAFT, index: true },
        featured: { type: Boolean, default: false, index: true },
        views: { type: Number, default: 0, index: true },
        publishedDate: { type: Date, default: null, index: true },
    },
    baseOpts
);
videoSchema.index({ title: 'text', description: 'text', tags: 'text' });
videoSchema.index({ status: 1, categoryId: 1, publishedDate: -1 });
videoSchema.index({ status: 1, featured: 1, publishedDate: -1 });

/* ------------------------------- Visitor ------------------------------- */
const visitorSchema = new Schema(
    {
        ip: { type: String, default: '', index: true },
        country: { type: String, default: '', index: true },
        region: { type: String, default: '' },
        city: { type: String, default: '' },
        deviceType: { type: String, default: '', index: true },
        browser: { type: String, default: '' },
        os: { type: String, default: '' },
        path: { type: String, default: '', index: true },
        referrer: { type: String, default: '' },
        userAgent: { type: String, default: '' },
        visitedAt: { type: Date, default: Date.now, index: true },
    },
    { timestamps: { createdAt: true, updatedAt: false }, versionKey: false }
);
// Dashboard queries: newest-first log + per-country/device aggregation.
visitorSchema.index({ visitedAt: -1 });

export const UserModel = model('User', userSchema);
export const ModuleModel = model('Module', moduleSchema);
export const CategoryModel = model('Category', categorySchema);
export const ArticleModel = model('Article', articleSchema);
export const VideoModel = model('Video', videoSchema);
export const VisitorModel = model('Visitor', visitorSchema);
