import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter, DialogTrigger } from "@/components/ui/dialog";
import { useState } from "react";
import { Checkbox } from "@/components/ui/checkbox";
import { cn } from "@/lib/utils";

interface SignInDialogProps {
    title: string;
    description: string;
    className?: string;
}

export function SignInDialog({ title = "Sign in to your account", description = "Enter your email below to sign in to your Arc Intelligencer account.", className }: SignInDialogProps) {
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [rememberMe, setRememberMe] = useState(false);
    
    return (
        <Dialog>
            <DialogTrigger asChild>
                <Button variant="outline" size="xs" className="bg-background">Sign In</Button>
            </DialogTrigger>
            <DialogContent className={cn("sm:max-w-md", className)}>
                <DialogHeader>
                    <DialogTitle>{title}</DialogTitle>
                    <DialogDescription>{description}</DialogDescription>
                </DialogHeader>
                <div className="space-y-2">
                    <Label htmlFor="email">Email</Label>
                    <Input
                        id="email"
                        onChange={e => setEmail(e.target.value)}
                        placeholder="m@example.com"
                        type="email"
                        value={email}
                    />
                    </div>
                    <div className="space-y-2">
                    <div className="flex items-center justify-between">
                        <Label htmlFor="password">Password</Label>
                        <a className="text-sm hover:underline" href="#">
                        Forgot your password?
                        </a>
                    </div>
                    <Input
                        id="password"
                        onChange={e => setPassword(e.target.value)}
                        type="password"
                        value={password}
                    />
                </div>
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                        <Checkbox id="remember" checked={rememberMe} onCheckedChange={(checked) => setRememberMe(checked === true)} />
                        <Label className="font-normal text-sm" htmlFor="remember">
                        Remember me
                        </Label>
                    </div>
                </div>
                <DialogFooter className="flex flex-col gap-2 items-center justify-end">
                    <Button>Sign in</Button>
                </DialogFooter>
            </DialogContent>
            
        </Dialog>
    );
}