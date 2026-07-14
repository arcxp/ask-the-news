import { useId } from "react";
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogTrigger } from "@/components/ui/dialog";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";

interface SubscribeDialogProps {
    title: string;
    description: string;
    className?: string;
}

function PlanCard({ name }: { name: string }) {
    const id = useId();
    return (
        <Card className="col-span-1">
            <CardHeader>
                <CardTitle>{name}</CardTitle>
            </CardHeader>
            <CardContent>
                <RadioGroup defaultValue="monthly" className="w-fit">
                    <div className="flex items-center gap-3">
                        <RadioGroupItem value="monthly" id={`${id}-monthly`} />
                        <Label htmlFor={`${id}-monthly`}>Monthly</Label>
                    </div>
                    <div className="flex items-center gap-3">
                        <RadioGroupItem value="yearly" id={`${id}-yearly`} />
                        <Label htmlFor={`${id}-yearly`}>Yearly</Label>
                    </div>
                </RadioGroup>
                <Button variant="default" size="xs">Subscribe</Button>
            </CardContent>
        </Card>
    );
}

export function SubscribeDialog({ title = "Subscribe to the Arc Intelligencer", description = "Pick a plan to get access to all of our content.", className }: SubscribeDialogProps) {
    
    return (
        <Dialog>
            <DialogTrigger asChild>
                <Button variant="default" size="xs">Subscribe</Button>
            </DialogTrigger>
            <DialogContent className={cn("sm:max-w-md max-w-xl", className)}>
                <DialogHeader>
                    <DialogTitle>{title}</DialogTitle>
                    <DialogDescription>{description}</DialogDescription>
                </DialogHeader>
                <div className="grid grid-cols-2 gap-4">
                    <PlanCard name="Core" />
                    <PlanCard name="Premium" />
                </div>
            </DialogContent>
            
        </Dialog>
    );
}