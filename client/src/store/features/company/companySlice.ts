import { createSlice, PayloadAction } from "@reduxjs/toolkit";
import { CompanyResponseType } from "@/types/company";

export interface CompanyState {
  currentCompany: CompanyResponseType | null;
}

const initialState: CompanyState = {
  currentCompany: null,
};

export const companySlice = createSlice({
  name: "company",
  initialState,
  reducers: {
    setCurrentCompany: (
      state,
      action: PayloadAction<CompanyResponseType | null>
    ) => {
      state.currentCompany = action.payload;
    },
  },
});

export const { setCurrentCompany } = companySlice.actions;

export default companySlice.reducer;
