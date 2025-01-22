import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Button } from "@/components/ui/button"

export function UserNav() {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" className="h-8 w-8 rounded-full bg-zinc-800 text-zinc-100">
          EK
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent className="w-56 bg-zinc-900 border-zinc-800" align="end">
        <DropdownMenuLabel className="text-zinc-100">
          <div className="flex flex-col space-y-1">
            <p className="text-sm font-medium">Erik Kim</p>
            <p className="text-xs text-zinc-400">erik@example.com</p>
          </div>
        </DropdownMenuLabel>
        <DropdownMenuSeparator className="bg-zinc-800" />
        <DropdownMenuItem className="text-zinc-100 focus:bg-zinc-800 focus:text-zinc-100">
          Profile Settings
        </DropdownMenuItem>
        <DropdownMenuItem className="text-zinc-100 focus:bg-zinc-800 focus:text-zinc-100">
          Speech History
        </DropdownMenuItem>
        <DropdownMenuItem className="text-zinc-100 focus:bg-zinc-800 focus:text-zinc-100">
          Progress Report
        </DropdownMenuItem>
        <DropdownMenuSeparator className="bg-zinc-800" />
        <DropdownMenuItem className="text-zinc-100 focus:bg-zinc-800 focus:text-zinc-100">Help & FAQ</DropdownMenuItem>
        <DropdownMenuItem className="text-zinc-100 focus:bg-zinc-800 focus:text-zinc-100">Sign out</DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}

