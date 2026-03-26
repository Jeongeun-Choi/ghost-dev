"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  projectKeys,
  fetchProjects,
  createProject,
  deleteProject,
  fetchGitHubRepos,
} from "./queries";

export function useProjects() {
  return useQuery({
    queryKey: projectKeys.lists(),
    queryFn: fetchProjects,
  });
}

export function useGitHubRepos() {
  return useQuery({
    queryKey: ["github", "repos"],
    queryFn: fetchGitHubRepos,
  });
}

export function useCreateProject() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: createProject,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: projectKeys.lists() });
    },
  });
}

export function useDeleteProject() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: deleteProject,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: projectKeys.lists() });
    },
  });
}
