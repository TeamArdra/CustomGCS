import React from "react";

const EmergencyControls = () => {

  const sendCommand = (command: string) => {
    console.log("Sending command:", command);
    alert(`Command Sent: ${command}`);
  };

  const switchToManual = () => {
    console.log("Switching to MANUAL MODE");
    alert("Emergency Manual Override Activated!");
  };

  return (
    <div className="bg-gray-900 p-4 rounded-xl text-white">

      <h2 className="text-lg font-bold mb-4">
        Emergency Controls
      </h2>

      <div className="grid grid-cols-2 gap-3">

        <button
          className="bg-green-600 hover:bg-green-700 p-3 rounded"
          onClick={() => sendCommand("ARM")}
        >
          ARM
        </button>

        <button
          className="bg-red-600 hover:bg-red-700 p-3 rounded"
          onClick={() => sendCommand("DISARM")}
        >
          DISARM
        </button>

        <button
          className="bg-yellow-500 hover:bg-yellow-600 p-3 rounded"
          onClick={() => sendCommand("RTL")}
        >
          RTL
        </button>

        <button
          className="bg-orange-500 hover:bg-orange-600 p-3 rounded"
          onClick={() => sendCommand("LAND")}
        >
          LAND
        </button>

        <button
          className="bg-purple-600 hover:bg-purple-700 p-3 rounded"
          onClick={() => sendCommand("LOITER")}
        >
          LOITER
        </button>

        <button
          className="bg-blue-600 hover:bg-blue-700 p-3 rounded"
          onClick={() => sendCommand("BRAKE")}
        >
          BRAKE
        </button>

        <button
          className="bg-rose-700 hover:bg-rose-800 p-3 rounded col-span-2 font-bold"
          onClick={switchToManual}
        >
          MANUAL OVERRIDE
        </button>

      </div>
    </div>
  );
};

export default EmergencyControls;