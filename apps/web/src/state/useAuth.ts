import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import * as api from '../api/client'
import { getClientDeviceId, guessDeviceName, guessDeviceType } from './useDevice'

export function useCurrentUser() {
  return useQuery({
    queryKey: ['me'],
    queryFn: api.me,
    retry: false,
    staleTime: 60_000,
  })
}

/** The server-assigned Device row for *this* browser — distinct from the raw
 * client_device_id in localStorage, which is only a local identity marker.
 * Annotation/progress writes need this row's `id` for the device_id foreign key.
 * Registration is an upsert keyed on client_device_id, so calling this on every
 * authenticated mount (not just right after login) is safe and keeps it fresh. */
export function useCurrentDevice() {
  const { data: user } = useCurrentUser()
  return useQuery({
    queryKey: ['device', 'this'],
    queryFn: () => api.registerDevice(getClientDeviceId(), guessDeviceName(), guessDeviceType()),
    enabled: !!user,
    staleTime: Infinity,
  })
}

export function useSignup() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (vars: { email: string; password: string; displayName: string }) =>
      api.signup(vars.email, vars.password, vars.displayName),
    onSuccess: (user) => queryClient.setQueryData(['me'], user),
  })
}

export function useLogin() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (vars: { email: string; password: string }) => api.login(vars.email, vars.password),
    onSuccess: (user) => queryClient.setQueryData(['me'], user),
  })
}

export function useLogout() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: api.logout,
    onSuccess: () => {
      queryClient.setQueryData(['me'], null)
      queryClient.clear()
    },
  })
}
