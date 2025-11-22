// src/components/Dashboard.tsx
import { useState, useEffect, useCallback } from 'react';
import { get, post } from 'aws-amplify/api';
import { fetchAuthSession } from 'aws-amplify/auth';
import { Button, Flex, Heading, Loader, Text, View } from '@aws-amplify/ui-react';
import { Toaster, toast } from 'sonner';
import { MapView } from './MapView';
import { ListView } from './ListView';
import { MyRequestsView } from './MyRequestsView';
import { MyDonationsView } from './MyDonationsview';

export type Surplus = {
  surplusId: string;
  foodType: string;
  quantity: number;
  expirationDate?: string;
  address?: string;
  donorId?: string;
  coordinates?: { lat: number; lng: number };
  imageKey?: string;
  donorInfo?: { name?: string; phoneNumber?: string };
  claimerInfo?: { name?: string; phoneNumber?: string };
  status?: 'active' | 'claimed' | 'fulfilled';
};

export type FoodRequest = {
  requestId: string;
  requesterId: string;
  foodType: string;
  quantity: number;
  description?: string;
  status: 'active' | 'fulfilled';
  createdAt: string;
  coordinates?: { lat: number; lng: number };
  donorInfo?: { name?: string; phoneNumber?: string };
  requesterInfo?: { name?: string; phoneNumber?: string };
};

type DashboardProps = {
  activeViewFromParent?: 'map' | 'list' | 'my-requests' | 'my-donations';
  onActiveViewChange?: (v: 'map' | 'list' | 'my-requests' | 'my-donations') => void;
  refreshSignal?: number;
};

export function Dashboard({ activeViewFromParent, onActiveViewChange, refreshSignal }: DashboardProps) {
  const [surpluses, setSurpluses] = useState<Surplus[]>([]);
  const [requests, setRequests] = useState<FoodRequest[]>([]);
  const [myRequests, setMyRequests] = useState<FoodRequest[]>([]);
  const [myDonations, setMyDonations] = useState<Surplus[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [errorObj, setErrorObj] = useState<any>(null);
  const [activeViewLocal, setActiveViewLocal] = useState<'map' | 'list' | 'my-requests' | 'my-donations'>('map');
  const [claimingId, setClaimingId] = useState<string | null>(null);
  const [fulfillingId, setFulfillingId] = useState<string | null>(null);

  const activeView = activeViewFromParent ?? activeViewLocal;
  const setActiveView = (v: 'map' | 'list' | 'my-requests' | 'my-donations') => {
    if (onActiveViewChange) onActiveViewChange(v);
    else setActiveViewLocal(v);
  };

  // helper to safely read response body (string)
  const safeReadBodyText = async (resp: any) => {
    try {
      if (!resp) return null;
      if (typeof resp.text === 'function') {
        return await resp.text();
      }
      if (resp.body && typeof resp.body.text === 'function') {
        return await resp.body.text();
      }
      if (resp.body && typeof resp.body.json === 'function') {
        try {
          const j = await resp.body.json();
          return JSON.stringify(j);
        } catch { /* ignore */ }
      }
      return JSON.stringify(resp);
    } catch (e) {
      return `Failed to read body: ${String(e)}`;
    }
  };

  const fetchData = useCallback(async () => {
    setIsLoading(true);
    setErrorObj(null);
    try {
      const session = await fetchAuthSession();
      const { idToken } = session.tokens ?? {};
      if (!idToken) throw new Error('User not authenticated (no idToken).');

      const authHeaders = { headers: { Authorization: idToken.toString() } };

      const [
        surplusesResponse,
        requestsResponse,
        myRequestsResponse,
        myDonationsResponse
      ] = await Promise.all([
        get({ apiName: 'FoodWasteAPI', path: '/surpluses', options: authHeaders }).response,
        get({ apiName: 'FoodWasteAPI', path: '/food-requests', options: authHeaders }).response,
        get({ apiName: 'FoodWasteAPI', path: '/food-requests/me', options: authHeaders }).response,
        get({ apiName: 'FoodWasteAPI', path: '/surpluses/me', options: authHeaders }).response
      ]);

      // parse bodies safely; if parse fails, fallback to empty array
      const parse = async (r: any) => {
        try {
          return await r.body.json();
        } catch (e) {
          try { return JSON.parse(await r.body.text()); } catch { return []; }
        }
      };

      const parsedSurpluses = (await parse(surplusesResponse)) as Surplus[] ?? [];
      const parsedRequests = (await parse(requestsResponse)) as FoodRequest[] ?? [];
      const parsedMyRequests = (await parse(myRequestsResponse)) as FoodRequest[] ?? [];
      const rawMyDonations = await (async () => {
        try {
          return await parse(myDonationsResponse);
        } catch {
          return [];
        }
      })();

      // Normalize myDonations (handle different backend keys)
      const normalized = (rawMyDonations || []).map((d: any) => {
        let claimerInfo = null;
        if (d?.claimerInfo && (d.claimerInfo.name || d.claimerInfo.phoneNumber)) {
          claimerInfo = d.claimerInfo;
        } else if (d?.claimedBy) {
          if (typeof d.claimedBy === 'object') {
            claimerInfo = {
              name: d.claimedBy.name ?? d.claimedBy.fullName ?? null,
              phoneNumber: d.claimedBy.phoneNumber ?? d.claimedBy.phone ?? null,
            };
          } else {
            claimerInfo = { name: String(d.claimedBy), phoneNumber: null };
          }
        } else if (d?.pickedBy) {
          if (typeof d.pickedBy === 'object') {
            claimerInfo = {
              name: d.pickedBy.name ?? d.pickedBy.fullName ?? null,
              phoneNumber: d.pickedBy.phoneNumber ?? d.pickedBy.phone ?? null,
            };
          } else {
            claimerInfo = { name: String(d.pickedBy), phoneNumber: null };
          }
        } else if (d?.picker) {
          if (typeof d.picker === 'object') {
            claimerInfo = {
              name: d.picker.name ?? d.picker.fullName ?? null,
              phoneNumber: d.picker.phoneNumber ?? d.picker.phone ?? null,
            };
          } else {
            claimerInfo = { name: String(d.picker), phoneNumber: null };
          }
        } else if (d?.claimer_name || d?.claimerName) {
          claimerInfo = {
            name: d.claimer_name ?? d.claimerName ?? null,
            phoneNumber: d.claimer_phone ?? d.claimerPhone ?? null,
          };
        }

        let status = d?.status ?? undefined;
        if (!status) {
          if (d?.claimed === true) status = 'claimed';
          else if (d?.fulfilled === true) status = 'fulfilled';
        }

        return {
          ...d,
          claimerInfo,
          status,
        } as Surplus;
      });

      setSurpluses(parsedSurpluses);
      setRequests(parsedRequests);
      setMyRequests(parsedMyRequests);
      setMyDonations(normalized);

    } catch (err: any) {
      // Build a debug object
      const debug: any = { message: String(err?.message ?? err), stack: err?.stack ?? null };

      try {
        if (err?.response) {
          debug.response = {};
          debug.responseStatus = err.response.status ?? err.response.statusCode ?? null;
          debug.responseText = await safeReadBodyText(err.response).catch((e) => `read error: ${String(e)}`);
        }
      } catch (e) {
        debug.responseReadError = String(e);
      }

      // Lightweight session metadata (no secrets)
      try {
        const sessionProbe = await fetchAuthSession().catch((e) => ({ error: String(e) }));
        // sessionProbe may be an error object (from the catch above). Guard before accessing tokens.
        if (sessionProbe && typeof sessionProbe === 'object' && 'tokens' in sessionProbe && (sessionProbe as any).tokens) {
          const tokens = (sessionProbe as any).tokens;
          debug.session = {
            hasTokens: !!tokens,
            // if tokens present, attempt to report basic expiry info (non-sensitive)
            idTokenExpiry: tokens?.idToken?.payload?.exp ?? null,
          };
        } else {
          debug.session = {
            hasTokens: false,
            idTokenExpiry: null,
          };
        }
      } catch (e) {
        debug.sessionError = String(e);
      }

      console.error('Dashboard fetchData detailed error debug:', debug);
      setErrorObj(debug);
      toast.error('Failed to load data.');
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  useEffect(() => {
    if (typeof refreshSignal === 'number') {
      fetchData();
    }
  }, [refreshSignal, fetchData]);

  const handleClaim = async (surplusId: string) => {
    setClaimingId(surplusId);
    try {
      const { idToken } = (await fetchAuthSession()).tokens ?? {};
      if (!idToken) throw new Error('User not authenticated');
      await post({
        apiName: 'FoodWasteAPI',
        path: `/surpluses/${surplusId}/claim`,
        options: { headers: { Authorization: idToken.toString() } }
      }).response;
      toast.success('Item claimed successfully!');
      await fetchData();
    } catch (err: any) {
      console.error('claim error:', err);
      const errorBody = await err.response?.body?.json?.().catch(() => ({}));
      toast.error(errorBody?.error || 'An error occurred while claiming.');
    } finally {
      setClaimingId(null);
    }
  };

  const handleFulfill = async (requestId: string) => {
    setFulfillingId(requestId);
    try {
      const { idToken } = (await fetchAuthSession()).tokens ?? {};
      if (!idToken) throw new Error('User not authenticated');
      await post({
        apiName: 'FoodWasteAPI',
        path: `/food-requests/${requestId}/fulfill`,
        options: { headers: { Authorization: idToken.toString() } }
      }).response;
      toast.success('Request fulfilled successfully!');
      await fetchData();
    } catch (err: any) {
      console.error('fulfill error:', err);
      const errorBody = await err.response?.body?.json?.().catch(() => ({}));
      toast.error(errorBody?.error || 'An error occurred while fulfilling the request.');
    } finally {
      setFulfillingId(null);
    }
  };

  const printDebug = () => {
    console.log('Dashboard debug object (also shown on screen):', errorObj);
    alert('Debug printed to console. Open DevTools -> Console and copy the object if you want to share it.');
  };

  const renderContent = () => {
    if (isLoading) return <Loader />;

    if (errorObj) {
      const msg = errorObj.message ?? 'A network error has occurred.';
      const status = errorObj.responseStatus ?? null;
      const responseText = errorObj.responseText ?? null;

      return (
        <div style={{ maxWidth: 900 }}>
          <Text style={{ marginBottom: 12, fontWeight: 600 }}>A network error has occurred.</Text>

          <div style={{ background: '#fff6f6', padding: 12, borderRadius: 8, color: '#7a1d1d', marginBottom: 12 }}>
            <div><strong>Error:</strong> {msg}</div>
            {status && <div><strong>HTTP status:</strong> {status}</div>}
            {responseText && (
              <div style={{ marginTop: 8 }}>
                <strong>Response body:</strong>
                <pre style={{ whiteSpace: 'pre-wrap', overflowX: 'auto', background: '#fff', padding: 8, borderRadius: 6 }}>{responseText}</pre>
              </div>
            )}
          </div>

          <div style={{ display: 'flex', gap: 12 }}>
            <Button onClick={() => fetchData()}>Retry</Button>
            <Button variation="link" onClick={printDebug}>Print debug to console</Button>
          </div>

          <div style={{ marginTop: 12, color: '#6b6b6b' }}>
            Common causes: CORS, expired/missing token, wrong API name in aws-exports, or backend down.
            Please click "Print debug to console" and paste the console output here if you're not sure.
          </div>
        </div>
      );
    }

    switch (activeView) {
      case 'map':
        return <MapView surpluses={surpluses} requests={requests} onClaim={handleClaim} claimingId={claimingId} onFulfill={handleFulfill} fulfillingId={fulfillingId} />;
      case 'my-requests':
        return <MyRequestsView myRequests={myRequests} />;
      case 'my-donations':
        return <MyDonationsView myDonations={myDonations} />;
      case 'list':
      default:
        return <ListView surpluses={surpluses} handleClaim={handleClaim} claimingId={claimingId} />;
    }
  };

  return (
    <View padding="large">
      <Toaster richColors position="top-center" />
      <Flex direction="column" gap="medium">
        <Heading level={2}>Find and claim surplus food in your area.</Heading>
        <View marginTop="medium">{renderContent()}</View>
      </Flex>
    </View>
  );
}
