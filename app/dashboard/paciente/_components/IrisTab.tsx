'use client'

import { Bot } from "lucide-react";
import { IrisChat } from "../../../../components/iris-chat";
import { Card } from "../../../../components/ui/card";

export default function IrisTab() {
  return (
    <div className="space-y-8">
      <div className="text-center space-y-4">
        <div className="w-20 h-20 bg-gradient-to-br from-purple-500 to-purple-600 rounded-3xl flex items-center justify-center mx-auto shadow-2xl">
          <Bot className="h-10 w-10 text-white" />
        </div>
        <div>
          <h1 className="text-3xl lg:text-4xl font-bold text-[#1E1D40] mb-2">
            Chat com IrisBot
          </h1>
          <p className="text-gray-600 text-lg">
            Sua assistente virtual para pacientes
          </p>
        </div>
      </div>

      <Card className="border-0 shadow-2xl backdrop-blur-sm">
        <IrisChat userType="paciente" />
      </Card>
    </div>
  );
}