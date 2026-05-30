import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  import.meta.env.VITE_SUPABASE_URL,
  import.meta.env.VITE_SUPABASE_ANON_KEY
);

export interface ApiEndpoint {
  id: string;
  groupId: string;
  name: string;
  vendorUat?: string;
  vendorProd?: string;
  trusthubUat?: string;
  trusthubProd?: string;
  createdAt: string;
}

export interface ApiGroup {
  id: string;
  jiraId?: string;
  name: string;
  vendor: string;
  type: string;
  description?: string;
  documentLink?: string;
  remarks?: string;
  status: 'active' | 'inactive';
  createdAt: string;
  endpoints: ApiEndpoint[];
}

export type NewEndpoint = Omit<ApiEndpoint, 'id' | 'groupId' | 'createdAt'>;
export type NewApiGroup = Omit<ApiGroup, 'id' | 'createdAt' | 'endpoints'> & {
  endpoints: NewEndpoint[];
};

interface ApiContextType {
  apiGroups: ApiGroup[];
  addApiGroup: (group: NewApiGroup) => Promise<void>;
  updateApiGroup: (id: string, group: NewApiGroup) => Promise<void>;
  deleteApiGroup: (id: string) => Promise<void>;
  toggleStatus: (id: string) => Promise<void>;
  checkDuplicate: (name: string, vendor: string, excludeId?: string) => boolean;
}

const ApiContext = createContext<ApiContextType | undefined>(undefined);

export function ApiProvider({ children }: { children: ReactNode }) {
  const [apiGroups, setApiGroups] = useState<ApiGroup[]>([]);

  const fetchAll = async () => {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session?.user) return;

    const { data: groups, error: gErr } = await supabase
      .from('api_groups')
      .select('*')
      .eq('user_id', session.user.id)
      .order('created_at', { ascending: false });

    if (gErr) { console.error('Error fetching api_groups:', gErr); return; }

    const groupIds = (groups ?? []).map((g: any) => g.id);
    if (groupIds.length === 0) {
      setApiGroups([]);
      return;
    }

    const { data: endpoints, error: eErr } = await supabase
      .from('api_endpoints')
      .select('*')
      .in('group_id', groupIds)
      .order('created_at', { ascending: true });

    if (eErr) { console.error('Error fetching api_endpoints:', eErr); return; }

    const mapped: ApiGroup[] = (groups ?? []).map((g: any) => ({
      id: g.id,
      jiraId: g.jira_id,
      name: g.name,
      vendor: g.vendor,
      type: g.type,
      description: g.description,
      documentLink: g.document_link,
      remarks: g.remarks,
      status: g.status,
      createdAt: g.created_at,
      endpoints: (endpoints ?? [])
        .filter((e: any) => e.group_id === g.id)
        .map((e: any) => ({
          id: e.id,
          groupId: e.group_id,
          name: e.name,
          vendorUat: e.vendor_uat,
          vendorProd: e.vendor_prod,
          trusthubUat: e.trusthub_uat,
          trusthubProd: e.trusthub_prod,
          createdAt: e.created_at,
        })),
    }));

    setApiGroups(mapped);
  };

  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_, session) => {
      if (session?.user) fetchAll();
      else setApiGroups([]);
    });

    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session?.user) fetchAll();
    });

    const channel = supabase
      .channel('api-changes')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'api_groups' }, fetchAll)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'api_endpoints' }, fetchAll)
      .subscribe();

    return () => {
      subscription.unsubscribe();
      supabase.removeChannel(channel);
    };
  }, []);

  const addApiGroup = async (group: NewApiGroup) => {
    const { data: { session } } = await supabase.auth.getSession();
    const groupId = Date.now().toString();

    const { error: gErr } = await supabase.from('api_groups').insert({
      id: groupId,
      user_id: session?.user?.id,
      jira_id: group.jiraId,
      name: group.name,
      vendor: group.vendor,
      type: group.type,
      description: group.description,
      document_link: group.documentLink,
      remarks: group.remarks,
      status: group.status,
    });

    if (gErr) { console.error('Error adding api_group:', gErr); return; }

    if (group.endpoints.length > 0) {
      const endpointRows = group.endpoints.map((ep, i) => ({
        id: `${groupId}_ep_${i}_${Date.now()}`,
        group_id: groupId,
        name: ep.name,
        vendor_uat: ep.vendorUat,
        vendor_prod: ep.vendorProd,
        trusthub_uat: ep.trusthubUat,
        trusthub_prod: ep.trusthubProd,
      }));

      const { error: eErr } = await supabase.from('api_endpoints').insert(endpointRows);
      if (eErr) console.error('Error adding endpoints:', eErr);
    }

    await fetchAll();
  };

  const updateApiGroup = async (id: string, group: NewApiGroup) => {
    const { error: gErr } = await supabase.from('api_groups').update({
      jira_id: group.jiraId,
      name: group.name,
      vendor: group.vendor,
      type: group.type,
      description: group.description,
      document_link: group.documentLink,
      remarks: group.remarks,
      status: group.status,
    }).eq('id', id);

    if (gErr) { console.error('Error updating api_group:', gErr); return; }

    // Delete all old endpoints and re-insert
    await supabase.from('api_endpoints').delete().eq('group_id', id);

    if (group.endpoints.length > 0) {
      const endpointRows = group.endpoints.map((ep, i) => ({
        id: `${id}_ep_${i}_${Date.now()}`,
        group_id: id,
        name: ep.name,
        vendor_uat: ep.vendorUat,
        vendor_prod: ep.vendorProd,
        trusthub_uat: ep.trusthubUat,
        trusthub_prod: ep.trusthubProd,
      }));

      const { error: eErr } = await supabase.from('api_endpoints').insert(endpointRows);
      if (eErr) console.error('Error updating endpoints:', eErr);
    }

    await fetchAll();
  };

  const deleteApiGroup = async (id: string) => {
    // Endpoints deleted via cascade (set up in Supabase) or manually:
    await supabase.from('api_endpoints').delete().eq('group_id', id);
    const { error } = await supabase.from('api_groups').delete().eq('id', id);
    if (error) console.error('Error deleting api_group:', error);
    else await fetchAll();
  };

  const toggleStatus = async (id: string) => {
    const group = apiGroups.find((g) => g.id === id);
    if (!group) return;

    const { error } = await supabase.from('api_groups').update({
      status: group.status === 'active' ? 'inactive' : 'active',
    }).eq('id', id);

    if (error) console.error('Error toggling status:', error);
    else await fetchAll();
  };

  const checkDuplicate = (name: string, vendor: string, excludeId?: string): boolean => {
    return apiGroups.some(
      (g) =>
        g.id !== excludeId &&
        g.name.trim().toLowerCase() === name.trim().toLowerCase() &&
        g.vendor.trim().toLowerCase() === vendor.trim().toLowerCase()
    );
  };

  return (
    <ApiContext.Provider value={{ apiGroups, addApiGroup, updateApiGroup, deleteApiGroup, toggleStatus, checkDuplicate }}>
      {children}
    </ApiContext.Provider>
  );
}

export function useApi() {
  const context = useContext(ApiContext);
  if (context === undefined) throw new Error('useApi must be used within an ApiProvider');
  return context;
}
