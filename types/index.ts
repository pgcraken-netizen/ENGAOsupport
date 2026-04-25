export type Meal = "full" | "normal" | "half" | "none";
export type Condition = "normal" | "slightly_poor" | "poor";

export type Resident = {
  id: string;
  name: string;
  kana: string | null;
  room: string | null;
  unit: string | null;
  is_active: boolean;
};
