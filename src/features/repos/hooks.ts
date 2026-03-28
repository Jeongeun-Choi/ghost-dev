"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  repoKeys,
  fetchRepos,
  createRepo,
  deleteRepo,
  fetchGitHubRepos,
} from "./queries";

export function useRepos() {
  return useQuery({
    queryKey: repoKeys.lists(),
    queryFn: fetchRepos,
  });
}

export function useGitHubRepos() {
  return useQuery({
    queryKey: ["github", "repos"],
    queryFn: fetchGitHubRepos,
  });
}

export function useCreateRepo() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: createRepo,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: repoKeys.lists() });
    },
  });
}

export function useDeleteRepo() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: deleteRepo,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: repoKeys.lists() });
    },
  });
}
