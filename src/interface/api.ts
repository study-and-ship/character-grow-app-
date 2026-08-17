export interface ApiSuccess<T> {
  data: T;
}

export interface ApiError {
  error: {
    code: string;
    message: string;
  };
}

export type ApiResponse<T> = ApiSuccess<T> | ApiError;

export type {
  CompleteQuizData,
  EquipmentData,
  InitializeUserData,
  PurchaseItemData,
  QuizSessionData,
  RankingsData,
  SubmitAnswerData,
} from "@/lib/api/rpc-schemas";

export type EquipmentSlotSummary = {
  user_item_id: number;
  item_id?: number;
  asset_key: string;
} | null;

export interface UserMeData {
  initialized: boolean;
  profile: {
    id: string;
    nickname: string | null;
  } | null;
}

export interface HomeData {
  profile: {
    nickname: string | null;
    coins: number;
  };
  character: {
    id: number;
    character_type: {
      id: number;
      name: string;
      sprite_key: string;
    };
    level: number;
    exp: number;
    required_exp: number;
    total_exp: number;
    growth_stage: string;
    equipment: Record<
      "pattern" | "hat" | "glasses" | "nest",
      EquipmentSlotSummary
    >;
  };
  streak: {
    current_streak: number;
    longest_streak: number;
    last_completed_date: string | null;
  };
  today_quiz: {
    session_id: number;
    status: string;
    answered_count: number;
    total_question_count: number;
    hearts_remaining: number;
  } | null;
}

export interface QuestionCategoryData {
  id: number;
  code: string;
  name: string;
}

export interface StudyCalendarData {
  year: number;
  month: number;
  days: Array<{
    date: string;
    completed: true;
    correct_count: number;
    total_question_count: number;
  }>;
}

export interface StudyRecordData {
  date: string;
  session: {
    id: number;
    status: "completed";
    category: QuestionCategoryData;
    correct_count: number;
    total_question_count: number;
    earned_exp: number;
    earned_coins: number;
    completed_at: string;
    questions: Array<{
      sort_order: number;
      question_text: string;
      selected_choice: { id: number; choice_text: string };
      correct_choice: { id: number; choice_text: string };
      is_correct: boolean;
      explanation: string | null;
    }>;
  } | null;
}

export interface ShopItemsData {
  coins: number;
  character: {
    id: number;
    growth_stage: string;
    target_type: "egg" | "pet";
  };
  items: Array<{
    id: number;
    category: {
      id: number;
      code: string;
      name: string;
      slot: "pattern" | "hat" | "glasses" | "nest";
      target_type: "egg" | "pet";
    };
    name: string;
    price: number;
    asset_key: string;
    owned: boolean;
    user_item_id: number | null;
    equipped: boolean;
  }>;
}

export interface InventoryData {
  character: {
    id: number;
    growth_stage: string;
    target_type: "egg" | "pet";
  };
  items: Array<{
    user_item_id: number;
    item_id: number;
    name: string;
    asset_key: string;
    slot: "pattern" | "hat" | "glasses" | "nest";
    target_type: "egg" | "pet";
    purchased_at: string;
    equipped: boolean;
  }>;
  equipment: Record<
    "pattern" | "hat" | "glasses" | "nest",
    {
      user_item_id: number;
      item_id: number;
      asset_key: string;
    } | null
  >;
}
