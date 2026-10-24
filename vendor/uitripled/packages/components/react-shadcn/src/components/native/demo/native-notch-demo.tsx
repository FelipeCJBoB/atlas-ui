"use client";

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { NativeNotch } from "../native-notch-shadcnui";

export function NativeNotchDefault() {
  return (
    <div className="relative h-[400px] w-full bg-gradient-to-br from-zinc-900 to-zinc-800 rounded-lg overflow-hidden">
      <NativeNotch
        collapsedIcon={
          <Avatar className="w-10 h-10">
            <AvatarImage src="https://github.com/shadcn.png" alt="@shadcn" />
            <AvatarFallback>SC</AvatarFallback>
          </Avatar>
        }
      >
        <div>
          <div className="flex items-start gap-3 mb-3">
            <Avatar className="w-12 h-12">
              <AvatarImage src="https://github.com/shadcn.png" alt="@shadcn" />
              <AvatarFallback>SC</AvatarFallback>
            </Avatar>
            <div className="flex-1">
              <h3 className="font-semibold text-base">shadcn</h3>
              <p className="text-sm text-muted-foreground">@shadcn</p>
            </div>
          </div>
          <p className="text-sm text-muted-foreground/90 leading-relaxed">
            Building beautiful, accessible components for the web. Creator of shadcn/ui.
          </p>
        </div>
      </NativeNotch>
    </div>
  );
}

export function NativeNotchLeftAlign() {
  return (
    <div className="relative h-[400px] w-full bg-gradient-to-br from-purple-900 to-purple-800 rounded-lg overflow-hidden">
      <NativeNotch
        collapsedIcon={
          <Avatar className="w-10 h-10">
            <AvatarImage src="https://github.com/vercel.png" alt="@vercel" />
            <AvatarFallback>VC</AvatarFallback>
          </Avatar>
        }
        position={{ top: 32, align: "left" }}
      >
        <div>
          <div className="flex items-start gap-3 mb-3">
            <Avatar className="w-12 h-12">
              <AvatarImage src="https://github.com/vercel.png" alt="@vercel" />
              <AvatarFallback>VC</AvatarFallback>
            </Avatar>
            <div className="flex-1">
              <h3 className="font-semibold text-base">Vercel</h3>
              <p className="text-sm text-muted-foreground">@vercel</p>
            </div>
          </div>
          <p className="text-sm text-muted-foreground/90 leading-relaxed">
            Develop. Preview. Ship. The best frontend teams use Vercel.
          </p>
        </div>
      </NativeNotch>
    </div>
  );
}

export function NativeNotchRelative() {
  return (
    <div className="relative h-[400px] w-full bg-gradient-to-br from-emerald-900 to-emerald-800 rounded-lg overflow-hidden p-8">
      <div className="grid justify-center">
        <NativeNotch
          collapsedIcon={
            <Avatar className="w-10 h-10">
              <AvatarImage src="https://github.com/nextjs.png" alt="@nextjs" />
              <AvatarFallback>NX</AvatarFallback>
            </Avatar>
          }
          className="relative top-0 left-0"
          position={{ top: 0, align: "left" }}
        >
          <div>
            <div className="flex items-start gap-3 mb-3">
              <Avatar className="w-12 h-12">
                <AvatarImage src="https://github.com/nextjs.png" alt="@nextjs" />
                <AvatarFallback>NX</AvatarFallback>
              </Avatar>
              <div className="flex-1">
                <h3 className="font-semibold text-base">Next.js</h3>
                <p className="text-sm text-muted-foreground">@nextjs</p>
              </div>
            </div>
            <p className="text-sm text-muted-foreground/90 leading-relaxed">
              The React Framework for the Web. Used by some of the world's largest companies.
            </p>
          </div>
        </NativeNotch>
      </div>
    </div>
  );
}
