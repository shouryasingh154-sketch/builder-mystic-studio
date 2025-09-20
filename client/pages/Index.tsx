import { useEffect, useMemo, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Slider } from "@/components/ui/slider";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogDescription } from "@/components/ui/dialog";
import { Phone, MessageSquare } from "lucide-react";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import { formatDistanceToNow } from "date-fns";
import {
  MapContainer,
  TileLayer,
  CircleMarker,
  useMap,
  Marker,
  Popup,
} from "react-leaflet";
import type { LatLngExpression } from "leaflet";
import "leaflet/dist/leaflet.css";

interface Report {
  id: string;
  createdAt: number;
  photoUrl?: string;
  audioUrl?: string;
  coords?: { lat: number; lng: number };
  category: "Sanitation" | "Public Works" | "Safety" | "Traffic" | "Other";
  urgency: number; // 1-5
  description: string;
}

const categories: Report["category"][] = [
  "Sanitation",
  "Public Works",
  "Safety",
  "Traffic",
  "Other",
];

function useGeolocation() {
  const [coords, setCoords] = useState<
    { lat: number; lng: number } | undefined
  >();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const get = () => {
    if (!("geolocation" in navigator)) {
      setError("Geolocation is not supported");
      return;
    }
    setLoading(true);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setCoords({ lat: pos.coords.latitude, lng: pos.coords.longitude });
        setLoading(false);
      },
      (err) => {
        setError(err.message);
        setLoading(false);
      },
      { enableHighAccuracy: true, timeout: 10000 },
    );
  };

  return { coords, loading, error, get };
}

function useRecorder() {
  const [recording, setRecording] = useState(false);
  const [audioUrl, setAudioUrl] = useState<string | undefined>();
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);

  const start = async () => {
    const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
    const mediaRecorder = new MediaRecorder(stream);
    mediaRecorderRef.current = mediaRecorder;
    chunksRef.current = [];
    mediaRecorder.ondataavailable = (e) => {
      if (e.data && e.data.size > 0) chunksRef.current.push(e.data);
    };
    mediaRecorder.onstop = () => {
      const blob = new Blob(chunksRef.current, { type: "audio/webm" });
      setAudioUrl(URL.createObjectURL(blob));
      stream.getTracks().forEach((t) => t.stop());
    };
    mediaRecorder.start();
    setRecording(true);
  };

  const stop = () => {
    mediaRecorderRef.current?.stop();
    setRecording(false);
  };

  const reset = () => setAudioUrl(undefined);

  return { recording, audioUrl, start, stop, reset };
}


function urgencyColor(u: number) {
  if (u >= 4) return "#ef4444"; // red-500
  if (u >= 3) return "#f59e0b"; // amber-500
  return "#22c55e"; // green-500
}

function departmentFor(category: Report["category"]) {
  switch (category) {
    case "Sanitation":
      return "Sanitation";
    case "Public Works":
      return "Public Works";
    case "Traffic":
      return "Traffic Mgmt";
    case "Safety":
      return "Public Safety";
    default:
      return "General Services";
  }
}

import { useLocation } from "react-router-dom";

export default function Index() {
  const [reports, setReports] = useState<Report[]>([]);

  // Form state
  const [photoUrl, setPhotoUrl] = useState<string | undefined>();
  const [description, setDescription] = useState("");
  const [category, setCategory] = useState<Report["category"]>("Sanitation");
  const [urgency, setUrgency] = useState<number>(3);
  const { coords, get, loading: locLoading } = useGeolocation();
  const { recording, audioUrl, start, stop, reset } = useRecorder();

  const [feedback, setFeedback] = useState("");

  const location = useLocation();
  const [tab, setTab] = useState<"user" | "admin">("user");
  useEffect(() => {
    setTab(location.hash === "#admin" ? "admin" : "user");
  }, [location.hash]);

  // Admin filters
  const [filterCategory, setFilterCategory] = useState<
    "All" | Report["category"]
  >("All");
  const [minUrgency, setMinUrgency] = useState(1);

  // User auth
  const [userAuthed, setUserAuthed] = useState(false);
  const [userEmail, setUserEmail] = useState("");
  const [userName, setUserName] = useState("");
  useEffect(() => {
    try {
      const e = localStorage.getItem("cp_user_email");
      const n = localStorage.getItem("cp_user_name");
      if (e) {
        setUserEmail(e);
        setUserName(n || "");
        setUserAuthed(true);
      }
    } catch {}
  }, []);
  const userLogin = (e: any) => {
    e.preventDefault();
    if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(userEmail)) {
      alert("Enter a valid email");
      return;
    }
    localStorage.setItem("cp_user_email", userEmail);
    if (userName) localStorage.setItem("cp_user_name", userName);
    setUserAuthed(true);
  };
  const userLogout = () => {
    localStorage.removeItem("cp_user_email");
    localStorage.removeItem("cp_user_name");
    setUserAuthed(false);
  };

  // Admin auth state (demo-only)
  const [adminAuthed, setAdminAuthed] = useState(false);
  const [adminEmail, setAdminEmail] = useState("");
  const [adminPass, setAdminPass] = useState("");
  useEffect(() => {
    try {
      if (localStorage.getItem("cp_admin") === "1") setAdminAuthed(true);
    } catch {}
  }, []);
  const login = (e: any) => {
    e.preventDefault();
    const ok =
      adminEmail.toLowerCase().endsWith("@city.gov") &&
      adminPass === "admin123";
    if (ok) {
      localStorage.setItem("cp_admin", "1");
      setAdminAuthed(true);
    } else {
      alert(
        "Invalid credentials. Use a @city.gov email and access code admin123",
      );
    }
  };
  const logout = () => {
    localStorage.removeItem("cp_admin");
    setAdminAuthed(false);
  };

  const filteredReports = useMemo(
    () =>
      reports.filter(
        (r) =>
          (filterCategory === "All" || r.category === filterCategory) &&
          r.urgency >= minUrgency,
      ),
    [reports, filterCategory, minUrgency],
  );

  const submit = () => {
    const newReport: Report = {
      id: Math.random().toString(36).slice(2),
      createdAt: Date.now(),
      photoUrl,
      audioUrl,
      coords,
      category,
      urgency,
      description: description.trim(),
    };
    setReports((prev) => [newReport, ...prev]);
    // Reset form (keep location to ease multiple reports)
    setPhotoUrl(undefined);
    setDescription("");
    setUrgency(3);
    reset();
  };


  return (
    <div className="bg-gradient-to-b from-white to-secondary" id="report">
      <section className="container mx-auto px-4 py-8">
        <div className="mb-8 text-center">
          <div className="mx-auto inline-flex items-center gap-2 rounded-full bg-primary/10 px-3 py-1 text-xs font-semibold text-primary">
            Real-time reporting • Mobile-first • Admin visibility
          </div>
          <h1 className="mt-4 text-3xl font-extrabold tracking-tight sm:text-4xl">
            Report issues. See impact instantly.
          </h1>
          <p className="mx-auto mt-3 max-w-2xl text-muted-foreground">
            Submit a photo, location, and a quick note or voice message. The
            live map and admin tools update in near real-time.
          </p>
        </div>

        <Tabs value={tab} onValueChange={(v: any) => setTab(v)} className="">
          <TabsList className="grid w-full grid-cols-2 md:w-auto">
            <TabsTrigger value="user">User</TabsTrigger>
            <TabsTrigger value="admin">Admin</TabsTrigger>
          </TabsList>
          <TabsContent value="user" className="mt-6">
            <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
              <Card>
                <CardHeader className="flex flex-row items-center justify-between">
                  <CardTitle>Submit a report</CardTitle>
                  {userAuthed ? (
                    <div className="flex items-center gap-3">
                      <span className="hidden text-xs text-muted-foreground sm:inline">
                        {userEmail}
                      </span>
                      <Button variant="ghost" onClick={userLogout}>
                        Sign out
                      </Button>
                    </div>
                  ) : null}
                </CardHeader>
                <CardContent className="space-y-5">
                  {!userAuthed ? (
                    <form className="space-y-4" onSubmit={userLogin}>
                      <div className="grid gap-4 sm:grid-cols-2">
                        <div>
                          <Label htmlFor="u-name">Name</Label>
                          <Input
                            id="u-name"
                            value={userName}
                            onChange={(e) => setUserName(e.target.value)}
                            placeholder="Your name"
                          />
                        </div>
                        <div>
                          <Label htmlFor="u-email">Email</Label>
                          <Input
                            id="u-email"
                            type="email"
                            value={userEmail}
                            onChange={(e) => setUserEmail(e.target.value)}
                            placeholder="you@example.com"
                            required
                          />
                        </div>
                      </div>
                      <Button type="submit" className="w-full">
                        Continue
                      </Button>
                      <p className="text-xs text-muted-foreground">
                        Sign in to submit reports. No password required in this
                        demo.
                      </p>
                    </form>
                  ) : (
                    <>
                      <div className="flex flex-wrap items-center justify-between gap-3">
                        <div className="text-sm text-muted-foreground">
                          Welcome{userName ? `, ${userName}` : ""}
                        </div>
                        <div className="flex gap-2">
                          <Dialog>
                            <DialogTrigger asChild>
                              <Button variant="secondary">
                                <Phone className="mr-2 h-4 w-4" /> Helpline
                              </Button>
                            </DialogTrigger>
                            <DialogContent>
                              <DialogHeader>
                                <DialogTitle>Helpline</DialogTitle>
                                <DialogDescription>Contact city support numbers</DialogDescription>
                              </DialogHeader>
                              <div className="space-y-2 text-sm">
                                <div className="flex justify-between"><span>Emergency</span><a href="tel:112" className="text-primary">112</a></div>
                                <div className="flex justify-between"><span>Sanitation</span><a href="tel:1916" className="text-primary">1916</a></div>
                                <div className="flex justify-between"><span>Public Works</span><a href="tel:+1800123456" className="text-primary">+1&nbsp;800&nbsp;123&nbsp;456</a></div>
                              </div>
                            </DialogContent>
                          </Dialog>
                          <Dialog>
                            <DialogTrigger asChild>
                              <Button variant="outline">
                                <MessageSquare className="mr-2 h-4 w-4" /> Feedback
                              </Button>
                            </DialogTrigger>
                            <DialogContent>
                              <DialogHeader>
                                <DialogTitle>Send feedback</DialogTitle>
                              </DialogHeader>
                              <div className="space-y-3">
                                <Textarea value={feedback} onChange={(e)=>setFeedback(e.target.value)} rows={4} placeholder="Share your feedback" />
                                <div className="flex justify-end">
                                  <Button onClick={()=>{ console.log("feedback", { feedback, userEmail, userName }); setFeedback(""); }}>Submit</Button>
                                </div>
                              </div>
                            </DialogContent>
                          </Dialog>
                        </div>
                      </div>
                      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                        <div className="space-y-2">
                          <Label htmlFor="photo">Photo</Label>
                          <Input
                            id="photo"
                            type="file"
                            accept="image/*"
                            capture="environment"
                            onChange={(e) => {
                              const file = e.target.files?.[0];
                              if (file) setPhotoUrl(URL.createObjectURL(file));
                            }}
                          />
                          {photoUrl && (
                            <img
                              src={photoUrl}
                              alt="Uploaded preview"
                              className="mt-2 aspect-video w-full rounded-md object-cover"
                            />
                          )}
                        </div>
                        <div className="space-y-2">
                          <Label>Category</Label>
                          <Select
                            value={category}
                            onValueChange={(v) =>
                              setCategory(v as Report["category"])
                            }
                          >
                            <SelectTrigger>
                              <SelectValue placeholder="Select category" />
                            </SelectTrigger>
                            <SelectContent>
                              {categories.map((c) => (
                                <SelectItem key={c} value={c}>
                                  {c}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                          <div className="pt-2">
                            <Label className="mb-2 block">
                              Urgency: {urgency}/5
                            </Label>
                            <Slider
                              value={[urgency]}
                              min={1}
                              max={5}
                              step={1}
                              onValueChange={(v) => setUrgency(v[0])}
                            />
                          </div>
                        </div>
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="desc">Short explanation</Label>
                        <Textarea
                          id="desc"
                          value={description}
                          onChange={(e) => setDescription(e.target.value)}
                          rows={4}
                          placeholder="Describe the issue briefly"
                        />
                      </div>

                      <div className="flex flex-wrap items-center gap-3">
                        {!recording && (
                          <Button
                            type="button"
                            variant="secondary"
                            onClick={start}
                          >
                            Start voice note
                          </Button>
                        )}
                        {recording && (
                          <Button
                            type="button"
                            variant="destructive"
                            onClick={stop}
                          >
                            Stop recording
                          </Button>
                        )}
                        {audioUrl && (
                          <div className="flex items-center gap-2">
                            <audio
                              controls
                              src={audioUrl}
                              className="max-w-[220px]"
                            />
                            <Button variant="ghost" onClick={reset}>
                              Remove
                            </Button>
                          </div>
                        )}
                      </div>

                      <Separator />

                      <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
                        <div className="md:col-span-1">
                          <Label className="mb-2 block">Location</Label>
                          <div className="space-y-2 text-sm text-muted-foreground">
                            <div>Lat: {coords?.lat?.toFixed(5) ?? "-"}</div>
                            <div>Lng: {coords?.lng?.toFixed(5) ?? "-"}</div>
                          </div>
                          <Button
                            className="mt-3"
                            onClick={get}
                            disabled={locLoading}
                          >
                            {locLoading
                              ? "Getting location..."
                              : "Use my location"}
                          </Button>
                        </div>
                        <div className="md:col-span-2">
                          <div className="flex h-56 items-center justify-center rounded-md border bg-secondary/40 text-sm text-muted-foreground">
                            Map preview removed for SIH submission
                          </div>
                        </div>
                      </div>

                      <div className="flex justify-end">
                        <Button
                          onClick={submit}
                          disabled={
                            !description.trim() &&
                            !photoUrl &&
                            !audioUrl &&
                            !coords
                          }
                        >
                          Submit report
                        </Button>
                      </div>
                    </>
                  )}
                </CardContent>
              </Card>

              <Card id="live-map">
                <CardHeader>
                  <CardTitle>Overview (map removed)</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="mb-4 grid grid-cols-1 gap-3 md:grid-cols-3">
                    <div>
                      <Label>Category</Label>
                      <Select
                        value={filterCategory}
                        onValueChange={(v) => setFilterCategory(v as any)}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="All" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="All">All</SelectItem>
                          {categories.map((c) => (
                            <SelectItem key={c} value={c}>
                              {c}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="md:col-span-2">
                      <Label className="mb-2 block">
                        Min urgency: {minUrgency}
                      </Label>
                      <Slider
                        value={[minUrgency]}
                        min={1}
                        max={5}
                        step={1}
                        onValueChange={(v) => setMinUrgency(v[0])}
                      />
                    </div>
                  </div>
                  <div className="h-60 overflow-hidden rounded-md">
                    <MapContainer
                      center={center}
                      zoom={12}
                      className="h-full w-full"
                    >
                      <TileLayer
                        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                        attribution="&copy; OpenStreetMap contributors"
                      />
                      {filteredReports.map((r) =>
                        r.coords ? (
                          <CircleMarker
                            key={r.id}
                            center={[r.coords.lat, r.coords.lng]}
                            radius={8 + r.urgency}
                            color={urgencyColor(r.urgency)}
                            weight={2}
                            opacity={0.8}
                            fillOpacity={0.5}
                          >
                            <Popup>
                              <div className="space-y-1">
                                <div className="font-semibold">
                                  {r.category}
                                </div>
                                <div className="text-xs text-muted-foreground">
                                  Urgency {r.urgency} •{" "}
                                  {formatDistanceToNow(r.createdAt, {
                                    addSuffix: true,
                                  })}
                                </div>
                                {r.photoUrl && (
                                  <img
                                    src={r.photoUrl}
                                    className="mt-2 h-20 w-32 rounded object-cover"
                                    alt="Report"
                                  />
                                )}
                                <div className="text-sm">{r.description}</div>
                                <div className="text-xs text-muted-foreground">
                                  Routed to {departmentFor(r.category)}
                                </div>
                              </div>
                            </Popup>
                          </CircleMarker>
                        ) : null,
                      )}
                    </MapContainer>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="admin" className="mt-6" id="admin">
            {!adminAuthed ? (
              <Card className="max-w-md mx-auto">
                <CardHeader>
                  <CardTitle>Admin sign-in</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <form className="space-y-4" onSubmit={login}>
                    <div>
                      <Label htmlFor="admin-email">Work email</Label>
                      <Input
                        id="admin-email"
                        type="email"
                        value={adminEmail}
                        onChange={(e) => setAdminEmail(e.target.value)}
                        placeholder="you@city.gov"
                        required
                      />
                    </div>
                    <div>
                      <Label htmlFor="admin-pass">Access code</Label>
                      <Input
                        id="admin-pass"
                        type="password"
                        value={adminPass}
                        onChange={(e) => setAdminPass(e.target.value)}
                        placeholder="••••••••"
                        required
                      />
                    </div>
                    <Button className="w-full" type="submit">
                      Sign in
                    </Button>
                    <p className="text-xs text-muted-foreground">
                      Demo: any @city.gov email + access code{" "}
                      <span className="font-semibold">admin123</span>
                    </p>
                  </form>
                </CardContent>
              </Card>
            ) : (
              <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
                <div className="lg:col-span-2">
                  <Card>
                    <CardHeader>
                      <CardTitle>City issues map</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="h-[360px] overflow-hidden rounded-md">
                        <MapContainer
                          center={center}
                          zoom={12}
                          className="h-full w-full"
                        >
                          <TileLayer
                            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                            attribution="&copy; OpenStreetMap contributors"
                          />
                          {filteredReports.map((r) =>
                            r.coords ? (
                              <CircleMarker
                                key={r.id}
                                center={[r.coords.lat, r.coords.lng]}
                                radius={8 + r.urgency}
                                color={urgencyColor(r.urgency)}
                                weight={2}
                                opacity={0.8}
                                fillOpacity={0.5}
                              >
                                <Popup>
                                  <div className="space-y-1">
                                    <div className="font-semibold">
                                      {r.category}
                                    </div>
                                    <div className="text-xs text-muted-foreground">
                                      Urgency {r.urgency} •{" "}
                                      {formatDistanceToNow(r.createdAt, {
                                        addSuffix: true,
                                      })}
                                    </div>
                                    {r.photoUrl && (
                                      <img
                                        src={r.photoUrl}
                                        className="mt-2 h-20 w-32 rounded object-cover"
                                        alt="Report"
                                      />
                                    )}
                                    <div className="text-sm">
                                      {r.description}
                                    </div>
                                    <div className="text-xs text-muted-foreground">
                                      Routed to {departmentFor(r.category)}
                                    </div>
                                  </div>
                                </Popup>
                              </CircleMarker>
                            ) : null,
                          )}
                        </MapContainer>
                      </div>
                    </CardContent>
                  </Card>
                </div>
                <div className="space-y-4">
                  <Card>
                    <CardHeader>
                      <CardTitle>Filters</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div>
                        <Label>Category</Label>
                        <Select
                          value={filterCategory}
                          onValueChange={(v) => setFilterCategory(v as any)}
                        >
                          <SelectTrigger>
                            <SelectValue placeholder="All" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="All">All</SelectItem>
                            {categories.map((c) => (
                              <SelectItem key={c} value={c}>
                                {c}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                      <div>
                        <Label className="mb-2 block">
                          Min urgency: {minUrgency}
                        </Label>
                        <Slider
                          value={[minUrgency]}
                          min={1}
                          max={5}
                          step={1}
                          onValueChange={(v) => setMinUrgency(v[0])}
                        />
                      </div>
                    </CardContent>
                  </Card>
                  <Card>
                    <CardHeader>
                      <CardTitle>Incoming reports</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-3">
                      {filteredReports.length === 0 && (
                        <div className="text-sm text-muted-foreground">
                          No reports yet. Submit one in the User tab.
                        </div>
                      )}
                      {filteredReports.map((r) => (
                        <div
                          key={r.id}
                          className="flex items-center gap-3 rounded-md border p-3"
                        >
                          {r.photoUrl ? (
                            <img
                              src={r.photoUrl}
                              className="size-14 rounded object-cover"
                              alt="Thumb"
                            />
                          ) : (
                            <div className="size-14 rounded bg-secondary" />
                          )}
                          <div className="min-w-0 flex-1">
                            <div className="flex flex-wrap items-center gap-2">
                              <div className="font-medium">{r.category}</div>
                              <Badge
                                style={{
                                  backgroundColor: urgencyColor(r.urgency),
                                  color: "white",
                                }}
                              >
                                U{r.urgency}
                              </Badge>
                              <span className="text-xs text-muted-foreground">
                                {formatDistanceToNow(r.createdAt, {
                                  addSuffix: true,
                                })}
                              </span>
                            </div>
                            <div className="truncate text-sm text-muted-foreground">
                              {r.description || "No description"}
                            </div>
                            <div className="text-xs text-muted-foreground">
                              Routed to {departmentFor(r.category)}
                            </div>
                          </div>
                        </div>
                      ))}
                    </CardContent>
                  </Card>
                </div>
              </div>
            )}
          </TabsContent>
        </Tabs>
      </section>
    </div>
  );
}
