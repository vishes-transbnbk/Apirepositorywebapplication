import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  import.meta.env.VITE_SUPABASE_URL,
  import.meta.env.VITE_SUPABASE_ANON_KEY
);

export interface ApiRecord {
  id: string;
  jiraId?: string;
  name: string;
  vendor: string;
  type: string;
  description?: string;
  vendorUat?: string;
  vendorProd?: string;
  trusthubUat?: string;
  trusthubProd?: string;
  documentLink?: string;
  remarks?: string;
  status: 'active' | 'inactive';
  createdAt: string;
}

interface ApiContextType {
  apis: ApiRecord[];
  addApi: (api: Omit<ApiRecord, 'id' | 'createdAt'>) => Promise<void>;
  updateApi: (id: string, api: Omit<ApiRecord, 'id' | 'createdAt'>) => Promise<void>;
  deleteApi: (id: string) => Promise<void>;
  toggleStatus: (id: string) => Promise<void>;
  checkDuplicate: (name: string, vendor: string, excludeId?: string) => boolean;
}

const ApiContext = createContext<ApiContextType | undefined>(undefined);

export function ApiProvider({ children }: { children: ReactNode }) {
  const [apis, setApis] = useState<ApiRecord[]>([]);

  const fetchApis = async () => {
    const { data, error } = await supabase
      .from('apis')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching apis:', error);
      return;
    }

    const mapped: ApiRecord[] = (data ?? []).map((a: any) => ({
      id: a.id,
      jiraId: a.jira_id,
      name: a.name,
      vendor: a.vendor,
      type: a.type,
      description: a.description,
      vendorUat: a.vendor_uat,
      vendorProd: a.vendor_prod,
      trusthubUat: a.trusthub_uat,
      trusthubProd: a.trusthub_prod,
      documentLink: a.document_link,
      remarks: a.remarks,
      status: a.status,
      createdAt: a.created_at,
    }));

    setApis(mapped);
  };

  useEffect(() => {
    // Wait for auth state before fetching
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (session?.user) {
        fetchApis();
      } else {
        setApis([]);
      }
    });

    // Also fetch immediately if already logged in
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session?.user) fetchApis();
    });

    // Real-time sync across browsers
    const channel = supabase
      .channel('apis-changes')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'apis' }, () => {
        fetchApis();
      })
      .subscribe();

    return () => {
      subscription.unsubscribe();
      supabase.removeChannel(channel);
    };
  }, []);

const addApi = async (api: Omit<ApiRecord, 'id' | 'createdAt'>) => {
    const { data: { session } } = await supabase.auth.getSession();

    const { error } = await supabase.from('apis').insert({
      id: Date.now().toString(),
      user_id: session?.user?.id,
      jira_id: api.jiraId,
      name: api.name,
      vendor: api.vendor,
      type: api.type,
      description: api.description,
      vendor_uat: api.vendorUat,
      vendor_prod: api.vendorProd,
      trusthub_uat: api.trusthubUat,
      trusthub_prod: api.trusthubProd,
      document_link: api.documentLink,
      remarks: api.remarks,
      status: api.status,
    });

    if (error) console.error('Error adding api:', error);
    else await fetchApis(); // ← add this
  };

  const updateApi = async (id: string, api: Omit<ApiRecord, 'id' | 'createdAt'>) => {
    const { error } = await supabase.from('apis').update({
      jira_id: api.jiraId,
      name: api.name,
      vendor: api.vendor,
      type: api.type,
      description: api.description,
      vendor_uat: api.vendorUat,
      vendor_prod: api.vendorProd,
      trusthub_uat: api.trusthubUat,
      trusthub_prod: api.trusthubProd,
      document_link: api.documentLink,
      remarks: api.remarks,
      status: api.status,
    }).eq('id', id);

    if (error) console.error('Error updating api:', error);
    else await fetchApis(); // ← add this
  };

  const deleteApi = async (id: string) => {
    const { error } = await supabase.from('apis').delete().eq('id', id);
    if (error) console.error('Error deleting api:', error);
    else await fetchApis(); // ← add this
  };

  const toggleStatus = async (id: string) => {
    const api = apis.find((a) => a.id === id);
    if (!api) return;

    const { error } = await supabase.from('apis').update({
      status: api.status === 'active' ? 'inactive' : 'active',
    }).eq('id', id);

    if (error) console.error('Error toggling status:', error);
    else await fetchApis(); // ← add this
  };

  const checkDuplicate = (name: string, vendor: string, excludeId?: string): boolean => {
    return apis.some(
      (api) =>
        api.id !== excludeId &&
        api.name.trim().toLowerCase() === name.trim().toLowerCase() &&
        api.vendor.trim().toLowerCase() === vendor.trim().toLowerCase()
    );
  };

  return (
    <ApiContext.Provider value={{ apis, addApi, updateApi, deleteApi, toggleStatus, checkDuplicate }}>
      {children}
    </ApiContext.Provider>
  );
}

export function useApi() {
  const context = useContext(ApiContext);
  if (context === undefined) {
    throw new Error('useApi must be used within an ApiProvider');
  }
  return context;
}