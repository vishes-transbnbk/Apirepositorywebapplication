import { createContext, useContext, useState, useEffect, ReactNode } from 'react';

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
  addApi: (api: Omit<ApiRecord, 'id' | 'createdAt'>) => void;
  updateApi: (id: string, api: Omit<ApiRecord, 'id' | 'createdAt'>) => void;
  deleteApi: (id: string) => void;
  toggleStatus: (id: string) => void;
  checkDuplicate: (name: string, vendor: string, excludeId?: string) => boolean;
}

const ApiContext = createContext<ApiContextType | undefined>(undefined);

export function ApiProvider({ children }: { children: ReactNode }) {
  const [apis, setApis] = useState<ApiRecord[]>([]);

  useEffect(() => {
    const storedApis = localStorage.getItem('api-repo-apis');
    if (storedApis) {
      setApis(JSON.parse(storedApis));
    } else {
      const mockData: ApiRecord[] = [
        {
          id: '1',
          jiraId: 'API-001',
          name: 'User Authentication API',
          vendor: 'Auth0',
          type: 'REST',
          description: 'Handles user authentication and authorization',
          vendorUat: `curl --location 'https://uat.auth0.com/api/v1/auth' \\
--header 'Content-Type: application/json' \\
--header 'Authorization: Bearer {token}' \\
--data '{"username": "testuser", "password": "testpass"}'`,
          vendorProd: `curl --location 'https://prod.auth0.com/api/v1/auth' \\
--header 'Content-Type: application/json' \\
--header 'Authorization: Bearer {token}' \\
--data '{"username": "user", "password": "pass"}'`,
          trusthubUat: `curl --location 'https://uat.trusthub.com/auth' \\
--header 'x-api-key: {api_key}' \\
--data '{"mobile": "1234567890"}'`,
          trusthubProd: 'curl -X POST https://prod.trusthub.com/auth',
          documentLink: 'https://docs.auth0.com/api',
          remarks: 'Critical service - monitor closely',
          status: 'active',
          createdAt: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString(),
        },
        {
          id: '2',
          jiraId: 'API-002',
          name: 'Payment Processing API',
          vendor: 'Stripe',
          type: 'REST',
          description: 'Processes payment transactions',
          vendorUat: 'curl -X POST https://uat.stripe.com/api/v1/payments',
          vendorProd: 'curl -X POST https://prod.stripe.com/api/v1/payments',
          trusthubUat: 'curl -X POST https://uat.trusthub.com/payments',
          trusthubProd: 'curl -X POST https://prod.trusthub.com/payments',
          documentLink: 'https://stripe.com/docs/api',
          status: 'active',
          createdAt: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString(),
        },
        {
          id: '3',
          jiraId: 'API-003',
          name: 'Customer Data API',
          vendor: 'Salesforce',
          type: 'SOAP',
          description: 'Retrieves customer information',
          vendorUat: 'curl -X GET https://uat.salesforce.com/api/customers',
          vendorProd: 'curl -X GET https://prod.salesforce.com/api/customers',
          status: 'active',
          createdAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString(),
        },
        {
          id: '4',
          jiraId: 'API-004',
          name: 'Email Notification API',
          vendor: 'SendGrid',
          type: 'REST',
          description: 'Sends email notifications to users',
          status: 'inactive',
          createdAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
        },
        {
          id: '5',
          jiraId: 'API-005',
          name: 'Analytics API',
          vendor: 'Google',
          type: 'GraphQL',
          description: 'Tracks user analytics and events',
          vendorProd: 'curl -X POST https://analytics.google.com/api/events',
          status: 'active',
          createdAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString(),
        },
      ];
      setApis(mockData);
      localStorage.setItem('api-repo-apis', JSON.stringify(mockData));
    }
  }, []);

  const saveApis = (newApis: ApiRecord[]) => {
    setApis(newApis);
    localStorage.setItem('api-repo-apis', JSON.stringify(newApis));
  };

  const addApi = (api: Omit<ApiRecord, 'id' | 'createdAt'>) => {
    const newApi: ApiRecord = {
      ...api,
      id: Date.now().toString(),
      createdAt: new Date().toISOString(),
    };
    saveApis([...apis, newApi]);
  };

  const updateApi = (id: string, api: Omit<ApiRecord, 'id' | 'createdAt'>) => {
    const updatedApis = apis.map((a) =>
      a.id === id ? { ...a, ...api } : a
    );
    saveApis(updatedApis);
  };

  const deleteApi = (id: string) => {
    saveApis(apis.filter((a) => a.id !== id));
  };

  const toggleStatus = (id: string) => {
    const updatedApis = apis.map((a) =>
      a.id === id
        ? { ...a, status: a.status === 'active' ? 'inactive' as const : 'active' as const }
        : a
    );
    saveApis(updatedApis);
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
