"use client"

import { format } from "date-fns"
import { MessageCircle } from "lucide-react"
import {
  Sidebar,
  SidebarContent,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuButton,
} from "@/components/ui/sidebar"

interface Conversation {
  id: string
  date: Date
  preview: string
}

interface ConversationSidebarProps {
  conversations: Conversation[]
  onSelect: (id: string) => void
  selectedId?: string
}

export function ConversationSidebar({ conversations, onSelect, selectedId }: ConversationSidebarProps) {
  return (
    <Sidebar className="bg-black border-r border-zinc-800">
      <SidebarHeader className="border-b border-zinc-800 p-4">
        <h2 className="text-xl font-semibold text-zinc-100">Past Sessions</h2>
      </SidebarHeader>
      <SidebarContent>
        <SidebarMenu>
          {conversations.map((conversation) => (
            <SidebarMenuItem key={conversation.id}>
              <SidebarMenuButton
                asChild
                isActive={selectedId === conversation.id}
                onClick={() => onSelect(conversation.id)}
              >
                <button className="w-full text-left text-zinc-100">
                  <MessageCircle className="mr-2 h-4 w-4" />
                  <div className="flex flex-col">
                    <span>Session {format(conversation.date, "MMM d, yyyy")}</span>
                    <span className="text-sm text-zinc-400 truncate">{conversation.preview}</span>
                  </div>
                </button>
              </SidebarMenuButton>
            </SidebarMenuItem>
          ))}
        </SidebarMenu>
      </SidebarContent>
    </Sidebar>
  )
}

