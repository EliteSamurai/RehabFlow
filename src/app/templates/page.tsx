"use client";

import { useState, useEffect } from "react";
import {
  Plus,
  Search,
  Edit,
  Trash2,
  Copy,
  Eye,
  Pause,
  MessageSquare,
  Calendar,
  Activity,
  Heart,
  Zap,
  Clock,
  Target,
  BarChart3,
  Settings,
  CheckCircle,
  AlertCircle,
  Send,
  Download,
  Upload,
  Sparkles,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { motion, AnimatePresence } from "framer-motion";
import { toast } from "sonner";

interface MessageTemplate {
  id: string;
  name: string;
  category: "reminder" | "exercise" | "progress" | "motivation" | "education";
  treatment_type?:
    | "post-surgical"
    | "sports-injury"
    | "chronic-pain"
    | "general";
  content: string;
  variables: string[];
  is_active: boolean;
  usage_count: number;
  success_rate: number;
  created_at: string;
  updated_at: string;
}

interface Campaign {
  id: string;
  name: string;
  type: "reminder" | "exercise" | "compliance" | "motivation";
  status: "draft" | "active" | "paused" | "completed";
  templates_count: number;
  patients_enrolled: number;
  success_rate: number;
  created_at: string;
}

export default function TemplatesPage() {
  const [templates, setTemplates] = useState<MessageTemplate[]>([]);
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("all");
  const [selectedTreatmentType, setSelectedTreatmentType] = useState("all");
  const [templateDialogOpen, setTemplateDialogOpen] = useState(false);
  const [selectedTemplate, setSelectedTemplate] =
    useState<MessageTemplate | null>(null);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [templateToDelete, setTemplateToDelete] =
    useState<MessageTemplate | null>(null);
  const [previewDialogOpen, setPreviewDialogOpen] = useState(false);
  const [activeTab, setActiveTab] = useState("templates");

  // Mock data - in production, this would come from your API
  useEffect(() => {
    const mockTemplates: MessageTemplate[] = [
      {
        id: "1",
        name: "24h Appointment Reminder",
        category: "reminder",
        treatment_type: "general",
        content:
          "Hi {{patient_name}}, this is a reminder about your physical therapy appointment tomorrow at {{appointment_time}} with {{therapist_name}}. Please reply CONFIRM or call {{clinic_phone}} if you need to reschedule. Reply STOP to opt out.",
        variables: [
          "patient_name",
          "appointment_time",
          "therapist_name",
          "clinic_phone",
        ],
        is_active: true,
        usage_count: 1247,
        success_rate: 94.2,
        created_at: "2024-01-15T10:00:00Z",
        updated_at: "2024-01-20T15:30:00Z",
      },
      {
        id: "2",
        name: "Post-Surgery Exercise Reminder",
        category: "exercise",
        treatment_type: "post-surgical",
        content:
          "Time for your post-surgery exercises, {{patient_name}}! Remember to do your {{exercise_name}} routine ({{sets}} sets of {{reps}}). Take it slow and listen to your body. Questions? Call us at {{clinic_phone}}. Reply STOP to opt out.",
        variables: [
          "patient_name",
          "exercise_name",
          "sets",
          "reps",
          "clinic_phone",
        ],
        is_active: true,
        usage_count: 892,
        success_rate: 87.5,
        created_at: "2024-01-10T14:30:00Z",
        updated_at: "2024-01-18T09:15:00Z",
      },
      {
        id: "3",
        name: "Progress Check-in",
        category: "progress",
        treatment_type: "general",
        content:
          "How are you feeling after this week's therapy sessions, {{patient_name}}? Rate your pain level 1-10 and reply with your number. Your progress matters to us! For urgent concerns, call {{clinic_phone}}. Reply STOP to opt out.",
        variables: ["patient_name", "clinic_phone"],
        is_active: true,
        usage_count: 634,
        success_rate: 78.9,
        created_at: "2024-01-08T11:20:00Z",
        updated_at: "2024-01-16T16:45:00Z",
      },
      {
        id: "4",
        name: "Sports Injury Motivation",
        category: "motivation",
        treatment_type: "sports-injury",
        content:
          "Great job staying committed to your recovery, {{patient_name}}! Athletes like you know that consistency is key. You're {{progress_percentage}}% through your program. Keep pushing - you've got this! 💪 Reply STOP to opt out.",
        variables: ["patient_name", "progress_percentage"],
        is_active: true,
        usage_count: 445,
        success_rate: 91.3,
        created_at: "2024-01-05T13:10:00Z",
        updated_at: "2024-01-12T10:20:00Z",
      },
      {
        id: "5",
        name: "Educational: Chronic Pain Management",
        category: "education",
        treatment_type: "chronic-pain",
        content:
          "💡 Tip for managing chronic pain: Gentle movement is often better than complete rest. Try your prescribed {{exercise_name}} for {{duration}} minutes today. Remember, progress isn't always linear - you're doing great! Reply STOP to opt out.",
        variables: ["exercise_name", "duration"],
        is_active: false,
        usage_count: 223,
        success_rate: 82.1,
        created_at: "2024-01-03T09:30:00Z",
        updated_at: "2024-01-10T14:15:00Z",
      },
    ];

    const mockCampaigns: Campaign[] = [
      {
        id: "1",
        name: "New Patient Welcome Series",
        type: "motivation",
        status: "active",
        templates_count: 4,
        patients_enrolled: 156,
        success_rate: 89.2,
        created_at: "2024-01-20T10:00:00Z",
      },
      {
        id: "2",
        name: "Post-Surgery Recovery Program",
        type: "exercise",
        status: "active",
        templates_count: 6,
        patients_enrolled: 78,
        success_rate: 92.5,
        created_at: "2024-01-18T14:30:00Z",
      },
      {
        id: "3",
        name: "No-Show Recovery Sequence",
        type: "reminder",
        status: "active",
        templates_count: 3,
        patients_enrolled: 45,
        success_rate: 76.8,
        created_at: "2024-01-15T11:20:00Z",
      },
    ];

    setTimeout(() => {
      setTemplates(mockTemplates);
      setCampaigns(mockCampaigns);
    }, 500);
  }, []);

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case "reminder":
        return <Calendar className="w-4 h-4" />;
      case "exercise":
        return <Activity className="w-4 h-4" />;
      case "progress":
        return <BarChart3 className="w-4 h-4" />;
      case "motivation":
        return <Heart className="w-4 h-4" />;
      case "education":
        return <Sparkles className="w-4 h-4" />;
      default:
        return <MessageSquare className="w-4 h-4" />;
    }
  };

  const getCategoryColor = (category: string) => {
    switch (category) {
      case "reminder":
        return "bg-blue-50 text-blue-700 border-blue-200";
      case "exercise":
        return "bg-green-50 text-green-700 border-green-200";
      case "progress":
        return "bg-purple-50 text-purple-700 border-purple-200";
      case "motivation":
        return "bg-red-50 text-red-700 border-red-200";
      case "education":
        return "bg-yellow-50 text-yellow-700 border-yellow-200";
      default:
        return "bg-gray-50 text-gray-700 border-gray-200";
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "active":
        return "bg-green-50 text-green-700 border-green-200";
      case "draft":
        return "bg-gray-50 text-gray-700 border-gray-200";
      case "paused":
        return "bg-yellow-50 text-yellow-700 border-yellow-200";
      case "completed":
        return "bg-blue-50 text-blue-700 border-blue-200";
      default:
        return "bg-gray-50 text-gray-700 border-gray-200";
    }
  };

  const filteredTemplates = templates.filter((template) => {
    const matchesSearch =
      template.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      template.content.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory =
      selectedCategory === "all" || template.category === selectedCategory;
    const matchesTreatmentType =
      selectedTreatmentType === "all" ||
      template.treatment_type === selectedTreatmentType;

    return matchesSearch && matchesCategory && matchesTreatmentType;
  });

  const handleEditTemplate = (template: MessageTemplate) => {
    setSelectedTemplate(template);
    setTemplateDialogOpen(true);
  };

  const handleDeleteTemplate = (template: MessageTemplate) => {
    setTemplateToDelete(template);
    setDeleteDialogOpen(true);
  };

  const handlePreviewTemplate = (template: MessageTemplate) => {
    setSelectedTemplate(template);
    setPreviewDialogOpen(true);
  };

  const handleToggleTemplate = (template: MessageTemplate) => {
    setTemplates((prev) =>
      prev.map((t) =>
        t.id === template.id ? { ...t, is_active: !t.is_active } : t
      )
    );
    toast.success(
      `Template ${template.is_active ? "deactivated" : "activated"}`
    );
  };

  const handleDuplicateTemplate = (template: MessageTemplate) => {
    const newTemplate = {
      ...template,
      id: Date.now().toString(),
      name: `${template.name} (Copy)`,
      usage_count: 0,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };
    setTemplates((prev) => [newTemplate, ...prev]);
    toast.success("Template duplicated successfully");
  };

  const stats = [
    {
      title: "Total Templates",
      value: templates.length,
      icon: MessageSquare,
      color: "text-blue-600",
      bgColor: "bg-blue-50",
      change: "+3 this month",
    },
    {
      title: "Active Templates",
      value: templates.filter((t) => t.is_active).length,
      icon: CheckCircle,
      color: "text-green-600",
      bgColor: "bg-green-50",
      change: "87% active",
    },
    {
      title: "Avg Success Rate",
      value: `${Math.round(templates.reduce((acc, t) => acc + t.success_rate, 0) / templates.length)}%`,
      icon: Target,
      color: "text-purple-600",
      bgColor: "bg-purple-50",
      change: "+2.3% vs last month",
    },
    {
      title: "Messages Sent",
      value: templates
        .reduce((acc, t) => acc + t.usage_count, 0)
        .toLocaleString(),
      icon: Send,
      color: "text-orange-600",
      bgColor: "bg-orange-50",
      change: "+15% this month",
    },
  ];

  return (
    <main className="min-h-screen bg-gray-50">
      <div className="container mx-auto py-8 max-w-7xl space-y-8">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4"
        >
          <div>
            <h1 className="text-3xl font-bold tracking-tight text-gray-900">
              Message Templates & Campaigns
            </h1>
            <p className="text-gray-600 mt-1">
              Create, manage, and optimize your patient communication templates
            </p>
          </div>
          <div className="flex gap-3">
            <Button variant="outline" size="sm">
              <Download className="w-4 h-4 mr-2" />
              Export Templates
            </Button>
            <Button variant="outline" size="sm">
              <Upload className="w-4 h-4 mr-2" />
              Import Templates
            </Button>
            <Button onClick={() => setTemplateDialogOpen(true)} size="sm">
              <Plus className="w-4 h-4 mr-2" />
              New Template
            </Button>
          </div>
        </motion.div>

        {/* Stats Cards */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6"
        >
          {stats.map((stat) => (
            <Card key={stat.title} className="relative overflow-hidden">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600">
                      {stat.title}
                    </p>
                    <div className="flex items-center space-x-2 mt-2">
                      <p className="text-3xl font-bold text-gray-900">
                        {stat.value}
                      </p>
                    </div>
                    <p className="text-xs text-gray-500 mt-1">{stat.change}</p>
                  </div>
                  <div
                    className={`w-12 h-12 ${stat.bgColor} rounded-lg flex items-center justify-center`}
                  >
                    <stat.icon className={`w-6 h-6 ${stat.color}`} />
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </motion.div>

        {/* Main Content */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
        >
          <Tabs
            value={activeTab}
            onValueChange={setActiveTab}
            className="space-y-6"
          >
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger
                value="templates"
                className="flex items-center gap-2"
              >
                <MessageSquare className="w-4 h-4" />
                Templates
              </TabsTrigger>
              <TabsTrigger
                value="campaigns"
                className="flex items-center gap-2"
              >
                <Target className="w-4 h-4" />
                Campaigns
              </TabsTrigger>
            </TabsList>

            {/* Templates Tab */}
            <TabsContent value="templates" className="space-y-6">
              <Card>
                <CardHeader>
                  <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                    <div>
                      <CardTitle>Message Templates</CardTitle>
                      <CardDescription>
                        Create and manage reusable message templates for patient
                        communication
                      </CardDescription>
                    </div>
                    <div className="flex items-center gap-3">
                      <div className="relative">
                        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                        <Input
                          placeholder="Search templates..."
                          value={searchQuery}
                          onChange={(e) => setSearchQuery(e.target.value)}
                          className="pl-10 w-64"
                        />
                      </div>
                      <Select
                        value={selectedCategory}
                        onValueChange={setSelectedCategory}
                      >
                        <SelectTrigger className="w-40">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="all">All Categories</SelectItem>
                          <SelectItem value="reminder">Reminders</SelectItem>
                          <SelectItem value="exercise">Exercise</SelectItem>
                          <SelectItem value="progress">Progress</SelectItem>
                          <SelectItem value="motivation">Motivation</SelectItem>
                          <SelectItem value="education">Education</SelectItem>
                        </SelectContent>
                      </Select>
                      <Select
                        value={selectedTreatmentType}
                        onValueChange={setSelectedTreatmentType}
                      >
                        <SelectTrigger className="w-40">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="all">All Types</SelectItem>
                          <SelectItem value="general">General</SelectItem>
                          <SelectItem value="post-surgical">
                            Post-Surgical
                          </SelectItem>
                          <SelectItem value="sports-injury">
                            Sports Injury
                          </SelectItem>
                          <SelectItem value="chronic-pain">
                            Chronic Pain
                          </SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="grid gap-6">
                    <AnimatePresence>
                      {filteredTemplates.map((template, index) => (
                        <motion.div
                          key={template.id}
                          initial={{ opacity: 0, y: 20 }}
                          animate={{ opacity: 1, y: 0 }}
                          exit={{ opacity: 0, y: -20 }}
                          transition={{ delay: index * 0.05 }}
                        >
                          <Card
                            className={`border-l-4 ${template.is_active ? "border-l-green-500" : "border-l-gray-300"}`}
                          >
                            <CardContent className="p-6">
                              <div className="flex items-start justify-between">
                                <div className="flex-1 min-w-0">
                                  <div className="flex items-center gap-3 mb-3">
                                    <h3 className="text-lg font-semibold text-gray-900 truncate">
                                      {template.name}
                                    </h3>
                                    <Badge
                                      className={getCategoryColor(
                                        template.category
                                      )}
                                    >
                                      {getCategoryIcon(template.category)}
                                      <span className="ml-1 capitalize">
                                        {template.category}
                                      </span>
                                    </Badge>
                                    {template.treatment_type &&
                                      template.treatment_type !== "general" && (
                                        <Badge
                                          variant="outline"
                                          className="text-xs"
                                        >
                                          {template.treatment_type.replace(
                                            "-",
                                            " "
                                          )}
                                        </Badge>
                                      )}
                                    <Switch
                                      checked={template.is_active}
                                      onCheckedChange={() =>
                                        handleToggleTemplate(template)
                                      }
                                      className="ml-2"
                                    />
                                  </div>

                                  <p className="text-gray-600 text-sm mb-4 line-clamp-2">
                                    {template.content}
                                  </p>

                                  <div className="flex items-center gap-6 text-sm text-gray-500">
                                    <div className="flex items-center gap-1">
                                      <Send className="w-4 h-4" />
                                      <span>
                                        {template.usage_count.toLocaleString()}{" "}
                                        sent
                                      </span>
                                    </div>
                                    <div className="flex items-center gap-1">
                                      <Target className="w-4 h-4" />
                                      <span>
                                        {template.success_rate}% success
                                      </span>
                                    </div>
                                    <div className="flex items-center gap-1">
                                      <Zap className="w-4 h-4" />
                                      <span>
                                        {template.variables.length} variables
                                      </span>
                                    </div>
                                    <div className="flex items-center gap-1">
                                      <Clock className="w-4 h-4" />
                                      <span>
                                        {new Date(
                                          template.updated_at
                                        ).toLocaleDateString()}
                                      </span>
                                    </div>
                                  </div>
                                </div>

                                <DropdownMenu>
                                  <DropdownMenuTrigger asChild>
                                    <Button variant="ghost" size="sm">
                                      <Settings className="w-4 h-4" />
                                    </Button>
                                  </DropdownMenuTrigger>
                                  <DropdownMenuContent align="end">
                                    <DropdownMenuItem
                                      onClick={() =>
                                        handlePreviewTemplate(template)
                                      }
                                    >
                                      <Eye className="mr-2 h-4 w-4" />
                                      Preview
                                    </DropdownMenuItem>
                                    <DropdownMenuItem
                                      onClick={() =>
                                        handleEditTemplate(template)
                                      }
                                    >
                                      <Edit className="mr-2 h-4 w-4" />
                                      Edit Template
                                    </DropdownMenuItem>
                                    <DropdownMenuItem
                                      onClick={() =>
                                        handleDuplicateTemplate(template)
                                      }
                                    >
                                      <Copy className="mr-2 h-4 w-4" />
                                      Duplicate
                                    </DropdownMenuItem>
                                    <DropdownMenuSeparator />
                                    <DropdownMenuItem
                                      onClick={() =>
                                        handleDeleteTemplate(template)
                                      }
                                      className="text-red-600 focus:text-red-600"
                                    >
                                      <Trash2 className="mr-2 h-4 w-4" />
                                      Delete
                                    </DropdownMenuItem>
                                  </DropdownMenuContent>
                                </DropdownMenu>
                              </div>
                            </CardContent>
                          </Card>
                        </motion.div>
                      ))}
                    </AnimatePresence>

                    {filteredTemplates.length === 0 && (
                      <div className="text-center py-12">
                        <MessageSquare className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                        <h3 className="text-lg font-semibold text-gray-900 mb-2">
                          No templates found
                        </h3>
                        <p className="text-gray-600 mb-4">
                          {searchQuery ||
                          selectedCategory !== "all" ||
                          selectedTreatmentType !== "all"
                            ? "Try adjusting your search or filters"
                            : "Create your first template to get started"}
                        </p>
                        <Button onClick={() => setTemplateDialogOpen(true)}>
                          <Plus className="w-4 h-4 mr-2" />
                          Create Template
                        </Button>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            {/* Campaigns Tab */}
            <TabsContent value="campaigns" className="space-y-6">
              <Card>
                <CardHeader>
                  <div className="flex justify-between items-center">
                    <div>
                      <CardTitle>Message Campaigns</CardTitle>
                      <CardDescription>
                        Automated message sequences for comprehensive patient
                        care
                      </CardDescription>
                    </div>
                    <Button onClick={() => setCampaignDialogOpen(true)}>
                      <Plus className="w-4 h-4 mr-2" />
                      New Campaign
                    </Button>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="grid gap-4">
                    {campaigns.map((campaign, index) => (
                      <motion.div
                        key={campaign.id}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: index * 0.1 }}
                      >
                        <Card>
                          <CardContent className="p-6">
                            <div className="flex items-center justify-between">
                              <div>
                                <div className="flex items-center gap-3 mb-2">
                                  <h3 className="text-lg font-semibold text-gray-900">
                                    {campaign.name}
                                  </h3>
                                  <Badge
                                    className={getStatusColor(campaign.status)}
                                  >
                                    {campaign.status === "active" && (
                                      <CheckCircle className="w-3 h-3 mr-1" />
                                    )}
                                    {campaign.status === "paused" && (
                                      <Pause className="w-3 h-3 mr-1" />
                                    )}
                                    {campaign.status === "draft" && (
                                      <Edit className="w-3 h-3 mr-1" />
                                    )}
                                    <span className="capitalize">
                                      {campaign.status}
                                    </span>
                                  </Badge>
                                </div>
                                <div className="flex items-center gap-6 text-sm text-gray-500">
                                  <span>
                                    {campaign.templates_count} templates
                                  </span>
                                  <span>
                                    {campaign.patients_enrolled} patients
                                    enrolled
                                  </span>
                                  <span>
                                    {campaign.success_rate}% success rate
                                  </span>
                                </div>
                              </div>
                              <div className="flex items-center gap-2">
                                <Button variant="outline" size="sm">
                                  <BarChart3 className="w-4 h-4 mr-2" />
                                  Analytics
                                </Button>
                                <Button variant="outline" size="sm">
                                  <Edit className="w-4 h-4 mr-2" />
                                  Edit
                                </Button>
                              </div>
                            </div>
                          </CardContent>
                        </Card>
                      </motion.div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </motion.div>
      </div>

      {/* Template Dialog */}
      <Dialog open={templateDialogOpen} onOpenChange={setTemplateDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>
              {selectedTemplate ? "Edit Template" : "Create New Template"}
            </DialogTitle>
            <DialogDescription>
              Create personalized message templates with variables for dynamic
              content
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="templateName">Template Name</Label>
              <Input
                id="templateName"
                placeholder="e.g., 24h Appointment Reminder"
                defaultValue={selectedTemplate?.name}
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="category">Category</Label>
                <Select defaultValue={selectedTemplate?.category || "reminder"}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="reminder">Reminder</SelectItem>
                    <SelectItem value="exercise">Exercise</SelectItem>
                    <SelectItem value="progress">Progress</SelectItem>
                    <SelectItem value="motivation">Motivation</SelectItem>
                    <SelectItem value="education">Education</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="treatmentType">Treatment Type</Label>
                <Select
                  defaultValue={selectedTemplate?.treatment_type || "general"}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="general">General</SelectItem>
                    <SelectItem value="post-surgical">Post-Surgical</SelectItem>
                    <SelectItem value="sports-injury">Sports Injury</SelectItem>
                    <SelectItem value="chronic-pain">Chronic Pain</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="content">Message Content</Label>
              <Textarea
                id="content"
                placeholder="Enter your message template here. Use {{variable_name}} for dynamic content."
                rows={4}
                defaultValue={selectedTemplate?.content}
              />
              <div className="text-xs text-gray-500">
                Available variables:{" "}
                {`{{ patient_name }}, {{ therapist_name }}, {{ clinic_name }}, {{ clinic_phone }}, {{ appointment_time }}`}
              </div>
            </div>
            <div className="flex items-center space-x-2">
              <Switch defaultChecked={selectedTemplate?.is_active ?? true} />
              <Label>Active template</Label>
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setTemplateDialogOpen(false)}
            >
              Cancel
            </Button>
            <Button
              onClick={() => {
                setTemplateDialogOpen(false);
                toast.success(
                  selectedTemplate ? "Template updated" : "Template created"
                );
              }}
            >
              {selectedTemplate ? "Update" : "Create"} Template
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Preview Dialog */}
      <Dialog open={previewDialogOpen} onOpenChange={setPreviewDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Template Preview</DialogTitle>
            <DialogDescription>
              Preview how this template will appear to patients
            </DialogDescription>
          </DialogHeader>
          <div className="py-4">
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <div className="flex items-center gap-2 mb-2">
                <MessageSquare className="w-4 h-4 text-blue-600" />
                <span className="text-sm font-medium text-blue-900">
                  SMS Preview
                </span>
              </div>
              <p className="text-sm text-gray-800">
                {selectedTemplate?.content
                  .replace(/\{\{patient_name\}\}/g, "John Doe")
                  .replace(/\{\{therapist_name\}\}/g, "Dr. Smith")
                  .replace(/\{\{clinic_name\}\}/g, "RehabFlow PT")
                  .replace(/\{\{clinic_phone\}\}/g, "(555) 123-4567")
                  .replace(/\{\{appointment_time\}\}/g, "2:00 PM")
                  .replace(/\{\{exercise_name\}\}/g, "knee strengthening")
                  .replace(/\{\{sets\}\}/g, "3")
                  .replace(/\{\{reps\}\}/g, "15")
                  .replace(/\{\{progress_percentage\}\}/g, "75")
                  .replace(/\{\{duration\}\}/g, "10")}
              </p>
            </div>
          </div>
          <DialogFooter>
            <Button onClick={() => setPreviewDialogOpen(false)}>Close</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2 text-red-600">
              <AlertCircle className="w-5 h-5" />
              Delete Template
            </AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete &ldquo;{templateToDelete?.name}
              &rdquo;? This action cannot be undone. Any active campaigns using
              this template will be affected.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => {
                if (templateToDelete) {
                  setTemplates((prev) =>
                    prev.filter((t) => t.id !== templateToDelete.id)
                  );
                  toast.success("Template deleted successfully");
                }
                setDeleteDialogOpen(false);
                setTemplateToDelete(null);
              }}
              className="bg-red-600 hover:bg-red-700 focus:ring-red-600"
            >
              <Trash2 className="w-4 h-4 mr-2" />
              Delete Template
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </main>
  );
}
