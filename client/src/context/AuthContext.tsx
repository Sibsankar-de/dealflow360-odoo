"use client";

import React, { createContext, useContext, useMemo, useCallback, useEffect } from "react";
import {
  AuthContextType,
  LoginUserRequest,
  RegisterUserRequest,
  UpdatePasswordRequest,
  UpdateUserRequest,
  UserResponseType,
} from "@/types/auth";
import {
  useGetProfileQuery,
  useLoginMutation,
  useRegisterMutation,
  useLogoutMutation,
  useUpdateProfileMutation,
  useUpdatePasswordMutation,
} from "@/store/features/user/userApi";
import { baseApi } from "@/store/baseApi";
import { useAppDispatch, useAppSelector } from "@/store";
import { setUser as setUserAction, clearUser as clearUserAction } from "@/store/features/user/userSlice";

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const dispatch = useAppDispatch();
  const reduxUser = useAppSelector((state) => state.user.user);

  const {
    data: profileData,
    isLoading: isProfileLoading,
    refetch: refetchUser,
  } = useGetProfileQuery(undefined, {
    refetchOnMountOrArgChange: true,
  });

  const [loginMutation] = useLoginMutation();
  const [registerMutation] = useRegisterMutation();
  const [logoutMutation] = useLogoutMutation();
  const [updateProfileMutation] = useUpdateProfileMutation();
  const [updatePasswordMutation] = useUpdatePasswordMutation();

  const user = profileData?.data?.user ?? reduxUser ?? null;
  const isAuthenticated = Boolean(user);

  useEffect(() => {
    if (profileData?.data?.user) {
      dispatch(setUserAction(profileData.data.user));
    }
  }, [profileData, dispatch]);

  const login = useCallback(
    async (credentials: LoginUserRequest): Promise<UserResponseType> => {
      const response = await loginMutation(credentials).unwrap();
      dispatch(setUserAction(response.data.user));
      return response.data.user;
    },
    [loginMutation, dispatch]
  );

  const register = useCallback(
    async (data: RegisterUserRequest): Promise<UserResponseType> => {
      const response = await registerMutation(data).unwrap();
      dispatch(setUserAction(response.data.user));
      return response.data.user;
    },
    [registerMutation, dispatch]
  );

  const logout = useCallback(async (): Promise<void> => {
    try {
      await logoutMutation().unwrap();
    } catch {
      // Clean up even if logout endpoint fails
    } finally {
      dispatch(clearUserAction());
      dispatch(baseApi.util.resetApiState());
      window.location.href = "/login";
    }
  }, [logoutMutation, dispatch]);

  const updateProfile = useCallback(
    async (data: UpdateUserRequest): Promise<UserResponseType> => {
      const response = await updateProfileMutation(data).unwrap();
      return response.data.user;
    },
    [updateProfileMutation]
  );

  const updatePassword = useCallback(
    async (data: UpdatePasswordRequest): Promise<void> => {
      await updatePasswordMutation(data).unwrap();
    },
    [updatePasswordMutation]
  );

  const value = useMemo<AuthContextType>(
    () => ({
      user,
      isAuthenticated,
      isLoading: isProfileLoading,
      login,
      register,
      logout,
      updateProfile,
      updatePassword,
      refetchUser,
    }),
    [
      user,
      isAuthenticated,
      isProfileLoading,
      login,
      register,
      logout,
      updateProfile,
      updatePassword,
      refetchUser,
    ]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
};

export default AuthContext;
