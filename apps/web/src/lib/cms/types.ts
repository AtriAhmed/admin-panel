import type {
  Campaign,
  CreateCampaign,
  CreateOperationRequest,
  OperationRequest,
  UpdateCampaign,
  UpdateOperationRequest,
} from "@/lib/admin/schemas";

export type OperationRequestRecord = OperationRequest;
export type CreateOperationRequestRecord = CreateOperationRequest;
export type UpdateOperationRequestRecord = UpdateOperationRequest;
export type CampaignBriefRecord = Campaign;
export type CreateCampaignBriefRecord = CreateCampaign;
export type UpdateCampaignBriefRecord = UpdateCampaign;

export type PayloadOperationRequestDocument = {
  id: number | string;
  owner: string;
  slug: string;
  status: OperationRequestRecord["status"];
  summary: string;
  title: string;
  updatedAt?: string;
};

export type PayloadCampaignBriefDocument = {
  budget: number;
  channel: CampaignBriefRecord["channel"];
  id: number | string;
  launchDate: string;
  name: string;
  owner: string;
  status: CampaignBriefRecord["status"];
  summary: string;
  updatedAt?: string;
};
