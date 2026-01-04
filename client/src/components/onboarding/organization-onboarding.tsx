import { useState } from "react";
import { useToast } from "@/hooks/use-toast";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Building2, MapPin, Phone } from "lucide-react";

interface OrganizationOnboardingProps {
    organizationId: number;
    organizationName: string;
    onComplete: () => void;
}

export default function OrganizationOnboarding({
    organizationId,
    organizationName,
    onComplete,
}: OrganizationOnboardingProps) {
    const { toast } = useToast();
    const [loading, setLoading] = useState(false);

    const [formData, setFormData] = useState({
        phone: "",
        address: "",
        city: "",
        state: "",
        pincode: "",
    });

    const [errors, setErrors] = useState<Record<string, string>>({});

    const validateForm = () => {
        const newErrors: Record<string, string> = {};

        if (!formData.phone.trim()) {
            newErrors.phone = "Phone number is required";
        } else {
            const phoneDigits = formData.phone.replace(/\D/g, "");
            if (phoneDigits.length !== 10) {
                newErrors.phone = "Phone number must be 10 digits";
            }
        }

        if (!formData.address.trim()) {
            newErrors.address = "Address is required";
        }

        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!validateForm()) {
            return;
        }

        setLoading(true);

        try {
            const response = await fetch(
                `/api/organizations/${organizationId}/contact-info`,
                {
                    method: "PATCH",
                    headers: {
                        "Content-Type": "application/json",
                    },
                    body: JSON.stringify(formData),
                }
            );

            if (!response.ok) {
                const error = await response.json();
                throw new Error(error.message || "Failed to update organization");
            }

            toast({
                title: "Setup Complete!",
                description: "Your organization information has been saved successfully.",
            });

            onComplete();
        } catch (error) {
            console.error("Onboarding error:", error);
            toast({
                title: "Error",
                description:
                    error instanceof Error
                        ? error.message
                        : "Failed to save organization information",
                variant: "destructive",
            });
        } finally {
            setLoading(false);
        }
    };

    return (
        <Dialog open={true} onOpenChange={() => { }}>
            <DialogContent className="sm:max-w-[550px]" onInteractOutside={(e) => e.preventDefault()} onEscapeKeyDown={(e) => e.preventDefault()}>
                <DialogHeader>
                    <DialogTitle className="text-2xl flex items-center gap-2">
                        <Building2 className="w-6 h-6 text-blue-600" />
                        Complete Your Organization Setup
                    </DialogTitle>
                    <DialogDescription>
                        Welcome to <span className="font-semibold">{organizationName}</span>
                        ! Please provide your organization's contact information to continue.
                        This information will be used in invoices and official documents.
                    </DialogDescription>
                </DialogHeader>

                <form onSubmit={handleSubmit}>
                    <div className="space-y-4 py-4">
                        {/* Phone Number */}
                        <div className="space-y-2">
                            <Label htmlFor="phone" className="flex items-center gap-2">
                                <Phone className="w-4 h-4 text-muted-foreground" />
                                Phone Number <span className="text-red-500">*</span>
                            </Label>
                            <Input
                                id="phone"
                                placeholder="Enter 10-digit phone number"
                                value={formData.phone}
                                onChange={(e) => {
                                    setFormData({ ...formData, phone: e.target.value });
                                    if (errors.phone) {
                                        setErrors({ ...errors, phone: "" });
                                    }
                                }}
                                className={errors.phone ? "border-red-500" : ""}
                            />
                            {errors.phone && (
                                <p className="text-sm text-red-500">{errors.phone}</p>
                            )}
                        </div>

                        {/* Address */}
                        <div className="space-y-2">
                            <Label htmlFor="address" className="flex items-center gap-2">
                                <MapPin className="w-4 h-4 text-muted-foreground" />
                                Address <span className="text-red-500">*</span>
                            </Label>
                            <Textarea
                                id="address"
                                placeholder="Enter street address"
                                rows={2}
                                value={formData.address}
                                onChange={(e) => {
                                    setFormData({ ...formData, address: e.target.value });
                                    if (errors.address) {
                                        setErrors({ ...errors, address: "" });
                                    }
                                }}
                                className={errors.address ? "border-red-500" : ""}
                            />
                            {errors.address && (
                                <p className="text-sm text-red-500">{errors.address}</p>
                            )}
                        </div>

                        {/* City and State */}
                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <Label htmlFor="city">City</Label>
                                <Input
                                    id="city"
                                    placeholder="Enter city"
                                    value={formData.city}
                                    onChange={(e) =>
                                        setFormData({ ...formData, city: e.target.value })
                                    }
                                />
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="state">State</Label>
                                <Input
                                    id="state"
                                    placeholder="Enter state"
                                    value={formData.state}
                                    onChange={(e) =>
                                        setFormData({ ...formData, state: e.target.value })
                                    }
                                />
                            </div>
                        </div>

                        {/* PIN Code */}
                        <div className="space-y-2">
                            <Label htmlFor="pincode">PIN Code</Label>
                            <Input
                                id="pincode"
                                placeholder="Enter PIN code (optional)"
                                value={formData.pincode}
                                onChange={(e) =>
                                    setFormData({ ...formData, pincode: e.target.value })
                                }
                            />
                        </div>
                    </div>

                    <DialogFooter>
                        <Button
                            type="submit"
                            className="w-full bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700"
                            disabled={loading}
                        >
                            {loading ? (
                                <>
                                    <span className="animate-spin mr-2">⏳</span> Saving...
                                </>
                            ) : (
                                "Complete Setup"
                            )}
                        </Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    );
}
