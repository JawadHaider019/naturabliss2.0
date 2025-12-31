import mongoose from "mongoose";

const bannerSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      trim: true,
      maxlength: 200,
      default: "",
    },
    desktopImageUrl: {
      type: String,
      required: true,
    },
    desktopImagePublicId: {
      type: String,
      default: "",
    },
    mobileImageUrl: {
      type: String,
      required: true,
    },
    mobileImagePublicId: {
      type: String,
      default: "",
    },
    linkUrl: {
      type: String,
      trim: true,
      default: "",
    },
    openInNewTab: {
      type: Boolean,
      default: false,
    },
    isActive: {
      type: Boolean,
      default: true,
    },
    order: {
      type: Number,
      default: 0,
    },
  },
  { timestamps: true }
);

export const Banner = mongoose.model("Banner", bannerSchema);