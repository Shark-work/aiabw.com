export type UUID = string;
export type ISODateString = string;
export type LanguageCode = "zh-CN" | "en-US" | "ja-JP" | "ko-KR" | string;

export type AgentStatus = "draft" | "active" | "archived";
export type AgentVisibility = "public" | "private" | "unlisted";
export type UserRole = "user" | "creator" | "moderator" | "admin";
export type SubscriptionStatus = "trialing" | "active" | "past_due" | "canceled" | "incomplete";
export type BillingInterval = "month" | "year";
export type PaymentStatus = "pending" | "confirming" | "confirmed" | "finished" | "failed" | "refunded" | "expired";

export type Category = {
  id: UUID;
  slug: string;
  name: string;
  description?: string | null;
  icon?: string | null;
  color?: string | null;
  sortOrder?: number | null;
  createdAt: ISODateString;
  updatedAt: ISODateString;
};

export type Agent = {
  id: UUID;
  slug: string;
  name: string;
  description: string;
  prompt?: string | null;
  systemPrompt?: string | null;
  avatarUrl?: string | null;
  coverUrl?: string | null;
  demoUrl?: string | null;
  model?: string | null;
  temperature?: number | null;
  status: AgentStatus;
  visibility: AgentVisibility;
  categoryId?: UUID | null;
  createdBy?: UUID | null;
  metadata?: Record<string, unknown>;
  tags?: string[];
  likesCount?: number;
  favoritesCount?: number;
  chatsCount?: number;
  createdAt: ISODateString;
  updatedAt: ISODateString;
  category?: Category | null;
};

export type Profile = {
  id: UUID;
  userId: UUID;
  username?: string | null;
  displayName?: string | null;
  avatarUrl?: string | null;
  bio?: string | null;
  website?: string | null;
  role: UserRole;
  language: LanguageCode;
  location?: string | null;
  isCreator?: boolean;
  createdAt: ISODateString;
  updatedAt: ISODateString;
};

export type SubscriptionPlan = {
  id: UUID;
  slug: string;
  name: string;
  description?: string | null;
  interval: BillingInterval;
  priceCents: number;
  currency: string;
  features?: string[];
  sortOrder?: number | null;
  createdAt: ISODateString;
  updatedAt: ISODateString;
};

export type Subscription = {
  id: UUID;
  userId: UUID;
  planId: UUID;
  status: SubscriptionStatus;
  provider?: string | null;
  providerCustomerId?: string | null;
  providerSubscriptionId?: string | null;
  currentPeriodStart?: ISODateString | null;
  currentPeriodEnd?: ISODateString | null;
  cancelAtPeriodEnd?: boolean;
  canceledAt?: ISODateString | null;
  createdAt: ISODateString;
  updatedAt: ISODateString;
  plan?: SubscriptionPlan | null;
};

export type Transaction = {
  id: UUID;
  userId: UUID;
  planSlug: string;
  provider: string;
  providerPaymentId?: string | null;
  paymentStatus: PaymentStatus;
  priceAmount: number;
  priceCurrency: string;
  payAmount?: string | null;
  payCurrency?: string | null;
  invoiceUrl?: string | null;
  orderId: string;
  orderDescription?: string | null;
  raw?: Record<string, unknown>;
  createdAt: ISODateString;
  updatedAt: ISODateString;
};

export type TrialQuota = {
  id: UUID;
  userId: UUID;
  trialType: string;
  usedCount: number;
  limitCount: number;
  resetAt?: ISODateString | null;
  createdAt: ISODateString;
  updatedAt: ISODateString;
};

export type TrialLog = {
  id: UUID;
  userId?: UUID | null;
  agentId?: UUID | null;
  provider?: string | null;
  promptTokens?: number | null;
  completionTokens?: number | null;
  status: string;
  createdAt: ISODateString;
};

export type AgentLike = {
  id: UUID;
  agentId: UUID;
  userId: UUID;
  createdAt: ISODateString;
};

export type AgentFavorite = {
  id: UUID;
  agentId: UUID;
  userId: UUID;
  createdAt: ISODateString;
};

export type AgentComment = {
  id: UUID;
  agentId: UUID;
  userId: UUID;
  content: string;
  createdAt: ISODateString;
  updatedAt: ISODateString;
};

export type AgentTag = {
  id: UUID;
  agentId: UUID;
  tag: string;
  createdAt: ISODateString;
};

export type Database = {
  public: {
    Tables: {
      categories: {
        Row: Category;
        Insert: Omit<Category, "id" | "createdAt" | "updatedAt"> & { id?: UUID; createdAt?: ISODateString; updatedAt?: ISODateString };
        Update: Partial<Omit<Category, "id" | "createdAt" | "updatedAt">>;
      };
      agents: {
        Row: Agent;
        Insert: Omit<Agent, "id" | "createdAt" | "updatedAt" | "category"> & { id?: UUID; createdAt?: ISODateString; updatedAt?: ISODateString };
        Update: Partial<Omit<Agent, "id" | "createdAt" | "updatedAt" | "category">>;
      };
      profiles: {
        Row: Profile;
        Insert: Omit<Profile, "id" | "createdAt" | "updatedAt"> & { id?: UUID; createdAt?: ISODateString; updatedAt?: ISODateString };
        Update: Partial<Omit<Profile, "id" | "createdAt" | "updatedAt">>;
      };
      subscription_plans: {
        Row: SubscriptionPlan;
        Insert: Omit<SubscriptionPlan, "id" | "createdAt" | "updatedAt"> & { id?: UUID; createdAt?: ISODateString; updatedAt?: ISODateString };
        Update: Partial<Omit<SubscriptionPlan, "id" | "createdAt" | "updatedAt">>;
      };
      subscriptions: {
        Row: Subscription;
        Insert: Omit<Subscription, "id" | "createdAt" | "updatedAt" | "plan"> & { id?: UUID; createdAt?: ISODateString; updatedAt?: ISODateString };
        Update: Partial<Omit<Subscription, "id" | "createdAt" | "updatedAt" | "plan">>;
      };
      transactions: {
        Row: Transaction;
        Insert: Omit<Transaction, "id" | "createdAt" | "updatedAt"> & { id?: UUID; createdAt?: ISODateString; updatedAt?: ISODateString };
        Update: Partial<Omit<Transaction, "id" | "createdAt" | "updatedAt">>;
      };
      trial_quotas: {
        Row: TrialQuota;
        Insert: Omit<TrialQuota, "id" | "createdAt" | "updatedAt"> & { id?: UUID; createdAt?: ISODateString; updatedAt?: ISODateString };
        Update: Partial<Omit<TrialQuota, "id" | "createdAt" | "updatedAt">>;
      };
      trial_logs: {
        Row: TrialLog;
        Insert: Omit<TrialLog, "id" | "createdAt"> & { id?: UUID; createdAt?: ISODateString };
        Update: Partial<Omit<TrialLog, "id" | "createdAt">>;
      };
      agent_likes: { Row: AgentLike; Insert: AgentLike; Update: Partial<AgentLike> };
      agent_favorites: { Row: AgentFavorite; Insert: AgentFavorite; Update: Partial<AgentFavorite> };
      agent_comments: { Row: AgentComment; Insert: Omit<AgentComment, "id" | "createdAt" | "updatedAt"> & { id?: UUID; createdAt?: ISODateString; updatedAt?: ISODateString }; Update: Partial<Omit<AgentComment, "id" | "createdAt" | "updatedAt">> };
      agent_tags: { Row: AgentTag; Insert: AgentTag; Update: Partial<AgentTag> };
    };
    Views: Record<string, never>;
    Functions: Record<string, never>;
    Enums: { agent_status: AgentStatus; agent_visibility: AgentVisibility; user_role: UserRole; subscription_status: SubscriptionStatus; billing_interval: BillingInterval; payment_status: PaymentStatus };
    CompositeTypes: Record<string, never>;
  };
};
